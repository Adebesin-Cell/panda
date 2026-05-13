import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { bundle } from '@pandacss/config'
import { logger } from '@pandacss/logger'
import { build as esbuild } from 'esbuild'
import { buildInfo } from './build-info'
import type { PandaContext } from './create-context'
import { writeLibManifest } from './manifest-writer'

export interface BuildLibOptions {
  outdir?: string
  /** Path to the source preset file, relative to the manifest at `<outdir>/panda.lib.json`. */
  preset?: string
  /** Pre-resolved @pandacss/dev version. Skips the node_modules walk in the writer. */
  pandaVersion?: string
}

const DEFAULT_OUTDIR = 'dist'
const DEFAULT_PRESET_SOURCE = '../preset.ts'
const COMPILED_PRESET_FILENAME = 'preset.mjs'

export async function buildLib(ctx: PandaContext, options: BuildLibOptions = {}): Promise<void> {
  const outdir = options.outdir ?? DEFAULT_OUTDIR
  const presetSource = options.preset ?? DEFAULT_PRESET_SOURCE
  const cwd = ctx.config.cwd ?? ctx.runtime.cwd()

  const buildinfoOutfile = join(cwd, outdir, 'panda.buildinfo.json')
  await buildInfo(ctx, buildinfoOutfile)

  const pkgPath = join(cwd, 'package.json')
  let pkg: any
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  } catch (error) {
    throw new Error(`Cannot read package.json at '${pkgPath}'.`, { cause: error })
  }

  const presetSourceAbs = resolvePresetSource(cwd, outdir, presetSource)
  const presetOutAbs = join(cwd, outdir, COMPILED_PRESET_FILENAME)
  const presetOutRelManifest = `./${COMPILED_PRESET_FILENAME}`

  await compilePreset(presetSourceAbs, presetOutAbs)
  const presetForManifest = presetOutRelManifest

  const presetExport = await detectPresetExport(cwd, outdir, presetForManifest)

  const importMap = normalizeImportMap(ctx.config.importMap)
  const { manifestPath } = writeLibManifest({
    cwd,
    outdir,
    preset: presetForManifest,
    buildinfo: './panda.buildinfo.json',
    importMap,
    pandaVersion: options.pandaVersion,
    pkg,
    presetExport,
    designSystem: ctx.config.designSystem,
  })
  logger.info('lib', `wrote ${manifestPath}`)

  patchPackageExports(pkgPath, pkg, outdir)
}

/**
 * Resolves the preset source path against either the manifest-relative
 * default (`<outdir>/../preset.ts`) or a cwd-relative override. Throws if
 * neither exists — `panda lib` cannot ship a working manifest without a
 * resolvable preset, so failing loud here is better than silently producing
 * a broken manifest that breaks consumers at install time.
 */
function resolvePresetSource(cwd: string, outdir: string, presetSource: string): string {
  if (isAbsolute(presetSource)) {
    if (!existsSync(presetSource)) {
      throw new Error(`Preset source not found at '${presetSource}'.`)
    }
    return presetSource
  }
  const manifestRel = join(cwd, outdir, presetSource)
  if (existsSync(manifestRel)) return manifestRel
  const cwdRel = join(cwd, presetSource)
  if (existsSync(cwdRel)) return cwdRel
  throw new Error(
    `Preset source not found. Looked for '${presetSource}' relative to manifest dir ('${manifestRel}') ` +
      `and cwd ('${cwdRel}'). 'panda lib' requires a preset file on disk.`,
  )
}

async function compilePreset(sourceAbs: string, outAbs: string): Promise<void> {
  try {
    await esbuild({
      entryPoints: [sourceAbs],
      outfile: outAbs,
      bundle: true,
      packages: 'external',
      format: 'esm',
      platform: 'node',
      target: 'node18',
      logLevel: 'silent',
    })
    logger.info('lib', `compiled preset → ${outAbs}`)
  } catch (e) {
    throw new Error(`Failed to compile preset at '${sourceAbs}': ${String(e)}`, { cause: e })
  }
}

const BUILTIN_PRESET_NAMES = new Set(['@pandacss/preset-base', '@pandacss/preset-panda'])

function isLibPreset(value: unknown): value is { name: string } {
  if (!value || typeof value !== 'object') return false
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' && !BUILTIN_PRESET_NAMES.has(name)
}

// Detect which named export of the compiled preset is the lib's preset by
// inspecting the bundled module itself. The earlier heuristic walked
// `ctx.config.presets` and returned the last non-builtin entry's `name`, but
// that picks the wrong preset when a lib composes multiple non-builtin presets
// (e.g. [colorPreset, typographyPreset]) and only one is the "main" export.
// Reading the source file directly is the source of truth.
async function detectPresetExport(
  cwd: string,
  outdir: string,
  presetPathRelativeToManifest: string,
): Promise<string | undefined> {
  let resolved: string | undefined
  if (isAbsolute(presetPathRelativeToManifest)) {
    resolved = existsSync(presetPathRelativeToManifest) ? presetPathRelativeToManifest : undefined
  } else {
    const manifestRel = join(cwd, outdir, presetPathRelativeToManifest)
    const cwdRel = join(cwd, presetPathRelativeToManifest)
    if (existsSync(manifestRel)) resolved = manifestRel
    else if (existsSync(cwdRel)) resolved = cwdRel
  }

  if (!resolved) {
    logger.warn(
      'lib',
      `preset not found at '${presetPathRelativeToManifest}' (relative to manifest or cwd) — manifest will omit presetExport`,
    )
    return undefined
  }

  let bundled: { config: any; dependencies: string[] }
  try {
    bundled = await bundle(resolved, cwd)
  } catch (e) {
    logger.warn(
      'lib',
      `could not bundle preset at '${resolved}' to detect export name — manifest will omit presetExport: ${String(e)}`,
    )
    return undefined
  }

  const candidate = bundled?.config
  if (!candidate || typeof candidate !== 'object') return undefined

  const candidateRecord = candidate as Record<string, unknown>

  if (isLibPreset(candidateRecord)) return 'default'

  for (const [key, value] of Object.entries(candidateRecord)) {
    if (key === 'default') continue
    if (isLibPreset(value)) return key
  }

  return undefined
}

function normalizeImportMap(importMap: unknown): Record<string, string> {
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
  // The package.json `exports` spec accepts three forms:
  //   - string  (sugar for `{ ".": "<string>" }`)
  //   - array   (conditional fallback list, also sugar for the `.` entry)
  //   - object  (the standard subpath form)
  // We must normalize to the object form before assignment — otherwise
  // `exports[key] = value` either attaches to a String wrapper (silently lost
  // on JSON.stringify) or mutates an array index.
  const existing = pkg.exports
  let exports: Record<string, any>
  let normalized = false
  if (typeof existing === 'string' || Array.isArray(existing)) {
    exports = { '.': existing }
    normalized = true
  } else if (existing && typeof existing === 'object') {
    exports = existing as Record<string, any>
  } else {
    exports = {}
  }

  const wanted: Record<string, string> = {
    './panda.lib.json': `./${outdir}/panda.lib.json`,
    './panda.buildinfo.json': `./${outdir}/panda.buildinfo.json`,
    './preset': `./${outdir}/${COMPILED_PRESET_FILENAME}`,
  }

  let changed = normalized
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
