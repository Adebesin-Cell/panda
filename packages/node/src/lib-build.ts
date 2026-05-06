import { readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { bundle } from '@pandacss/config'
import { logger } from '@pandacss/logger'
import { buildInfo } from './build-info'
import type { PandaContext } from './create-context'
import { writeLibManifest } from './manifest-writer'

export interface BuildLibOptions {
  /** Output directory for dist artifacts (relative to cwd). Default: 'dist'. */
  outdir?: string
  /** Path to preset file relative to manifest. Default: '../preset.ts'. */
  preset?: string
  /**
   * Pre-resolved @pandacss/dev version (e.g. '2.5.0'). When provided, skips
   * the filesystem walk for installed version lookup inside the manifest
   * writer. Useful for `panda lib --watch` to memoize across rebuilds.
   */
  pandaVersion?: string
}

const DEFAULT_OUTDIR = 'dist'
const DEFAULT_PRESET_PATH = '../preset.ts'

/**
 * Composes the lib-author flow into one call:
 * 1. Set libraryMode on the encoder so designSystem hydration is skipped
 * 2. Run buildInfo (extracts source, writes buildinfo.json)
 * 3. Write panda.lib.json manifest
 * 4. Patch the lib's package.json exports
 */
export async function buildLib(ctx: PandaContext, options: BuildLibOptions = {}): Promise<void> {
  const outdir = options.outdir ?? DEFAULT_OUTDIR
  const preset = options.preset ?? DEFAULT_PRESET_PATH
  const cwd = ctx.config.cwd ?? ctx.runtime.cwd()

  // Tell the encoder we're a lib, suppress designSystem hydration on this context
  ctx.config.libraryMode = true

  // Step 1: extract + ship buildinfo
  const buildinfoOutfile = join(cwd, outdir, 'panda.buildinfo.json')
  await buildInfo(ctx, buildinfoOutfile)

  // Read package.json once. Pass it to both consumers.
  const pkgPath = join(cwd, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  // Detect which export of the preset file is the lib's own preset
  const libPresetName = findLibPresetName(ctx.config.presets as any[])
  const presetExport = await detectPresetExport(cwd, outdir, preset, libPresetName)

  // Step 2: write manifest
  const importMap = normalizeImportMap(ctx.config.importMap)
  const { manifestPath } = writeLibManifest({
    cwd,
    outdir,
    preset,
    buildinfo: './panda.buildinfo.json',
    importMap,
    pandaVersion: options.pandaVersion,
    pkg,
    presetExport,
  })
  logger.info('lib', `wrote ${manifestPath}`)

  // Step 3: patch package.json exports
  patchPackageExports(pkgPath, pkg, outdir)
}

/**
 * Finds the lib's own preset name from the resolved config's presets array,
 * filtering out panda built-ins.
 */
function findLibPresetName(presets: unknown[] | undefined): string | undefined {
  if (!Array.isArray(presets)) return undefined

  // Panda built-ins to filter out
  const builtinNames = new Set(['@pandacss/preset-base', '@pandacss/preset-panda'])

  // Walk in REVERSE — convention is that a lib's own preset is declared
  // LAST in the user's panda.config.ts `presets:` array, after panda's
  // defaults and any parent-lib presets. After getResolvedConfig flattens
  // the chain (depth-first), the lib's own preset is also the last entry
  // in the resolved stack. Reverse walk picks it cleanly.
  //
  // Edge case: if a lib has two non-builtin presets in its array (e.g.
  // [myLib, externalLib]), reverse walk picks externalLib. That's an
  // unusual setup; document if it becomes a real concern.
  for (let i = presets.length - 1; i >= 0; i--) {
    const p = presets[i] as any
    if (p && typeof p === 'object' && typeof p.name === 'string' && !builtinNames.has(p.name)) {
      return p.name
    }
  }

  return undefined
}

/**
 * Bundles the preset file and finds which export key matches the lib's preset
 * by `name`. Returns the export name (e.g. `'testPreset'` or `'default'`).
 */
async function detectPresetExport(
  cwd: string,
  outdir: string,
  presetPathRelativeToManifest: string,
  libPresetName: string | undefined,
): Promise<string | undefined> {
  if (!libPresetName) return undefined

  // The preset path is relative to the manifest, which lives at <cwd>/<outdir>/panda.lib.json.
  // Resolve from the manifest directory first so that the default '../preset.ts' correctly
  // points to <cwd>/preset.ts rather than one level above cwd. If bundle fails from the
  // manifest-relative path, fall back to cwd-relative resolution for backwards compatibility.
  const manifestRelPath = isAbsolute(presetPathRelativeToManifest)
    ? presetPathRelativeToManifest
    : join(cwd, outdir, presetPathRelativeToManifest)
  const cwdRelPath = isAbsolute(presetPathRelativeToManifest)
    ? presetPathRelativeToManifest
    : join(cwd, presetPathRelativeToManifest)

  let bundled: { config: any; dependencies: string[] }
  try {
    bundled = await bundle(manifestRelPath, cwd)
  } catch {
    // Fall back to cwd-relative if manifest-relative resolution fails
    try {
      bundled = await bundle(cwdRelPath, cwd)
    } catch (e) {
      logger.warn(
        'lib',
        `could not bundle preset at '${cwdRelPath}' to detect export name — manifest will omit presetExport: ${String(e)}`,
      )
      return undefined
    }
  }

  // `bundle` returns `{ config: mod?.default ?? mod }`.
  // - If the file has a default export, `config` IS the preset value directly.
  // - If the file has only named exports, `config` IS the whole module object
  //   (e.g. `{ testPreset: <Preset> }`).
  const candidate = bundled?.config
  if (!candidate || typeof candidate !== 'object') return undefined

  // If config itself has `name` matching libPresetName, the file uses a default export
  if ((candidate as any).name === libPresetName) return 'default'

  // Otherwise assume it's a namespace object — find the matching named export
  for (const [key, value] of Object.entries(candidate)) {
    if (key === 'default') continue
    if (value && typeof value === 'object' && (value as any).name === libPresetName) {
      return key
    }
  }

  return undefined
}

function normalizeImportMap(importMap: unknown): Record<string, string> {
  // The config's importMap may be a string, object, or array. Pick the first
  // object form (or convert string to a default shape).
  if (!importMap) return {}

  if (typeof importMap === 'string') {
    return {
      css: `${importMap}/css`,
      recipes: `${importMap}/recipes`,
      patterns: `${importMap}/patterns`,
      jsx: `${importMap}/jsx`,
      tokens: `${importMap}/tokens`,
    }
  }

  if (Array.isArray(importMap)) {
    // Use the first object-shaped entry, or convert the first string entry
    const first = importMap[0]
    if (typeof first === 'string') return normalizeImportMap(first)
    if (first && typeof first === 'object') return first as Record<string, string>
    return {}
  }

  if (typeof importMap === 'object') {
    return importMap as Record<string, string>
  }

  return {}
}

function patchPackageExports(pkgPath: string, pkg: any, outdir: string): void {
  const exports = pkg.exports ?? {}

  const wanted: Record<string, string> = {
    './panda.lib.json': `./${outdir}/panda.lib.json`,
    './panda.buildinfo.json': `./${outdir}/panda.buildinfo.json`,
  }

  let changed = false
  for (const [key, value] of Object.entries(wanted)) {
    if (exports[key] !== value) {
      exports[key] = value
      changed = true
    }
  }

  if (changed) {
    pkg.exports = exports
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    logger.info('lib', `updated ${pkgPath} exports`)
  }
}
