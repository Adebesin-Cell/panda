import { readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { bundle } from '@pandacss/config'
import { logger } from '@pandacss/logger'
import { buildInfo } from './build-info'
import type { PandaContext } from './create-context'
import { writeLibManifest } from './manifest-writer'

export interface BuildLibOptions {
  outdir?: string
  preset?: string
  /** Pre-resolved @pandacss/dev version. Skips the node_modules walk in the writer. */
  pandaVersion?: string
}

const DEFAULT_OUTDIR = 'dist'
const DEFAULT_PRESET_PATH = '../preset.ts'

export async function buildLib(ctx: PandaContext, options: BuildLibOptions = {}): Promise<void> {
  const outdir = options.outdir ?? DEFAULT_OUTDIR
  const preset = options.preset ?? DEFAULT_PRESET_PATH
  const cwd = ctx.config.cwd ?? ctx.runtime.cwd()

  ctx.config.libraryMode = true

  const buildinfoOutfile = join(cwd, outdir, 'panda.buildinfo.json')
  await buildInfo(ctx, buildinfoOutfile)

  const pkgPath = join(cwd, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  const libPresetName = findLibPresetName(ctx.config.presets as any[])
  const presetExport = await detectPresetExport(cwd, outdir, preset, libPresetName)

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

  patchPackageExports(pkgPath, pkg, outdir)
}

// reverse walk — lib's own preset is conventionally last after panda defaults and parent-lib chains
function findLibPresetName(presets: unknown[] | undefined): string | undefined {
  if (!Array.isArray(presets)) return undefined

  const builtinNames = new Set(['@pandacss/preset-base', '@pandacss/preset-panda'])

  for (let i = presets.length - 1; i >= 0; i--) {
    const p = presets[i] as any
    if (p && typeof p === 'object' && typeof p.name === 'string' && !builtinNames.has(p.name)) {
      return p.name
    }
  }

  return undefined
}

async function detectPresetExport(
  cwd: string,
  outdir: string,
  presetPathRelativeToManifest: string,
  libPresetName: string | undefined,
): Promise<string | undefined> {
  if (!libPresetName) return undefined

  // path is manifest-relative (manifest lives at cwd/outdir/); fall back to cwd-relative for older shapes
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

  // bundle returns { config: mod?.default ?? mod } — config is either the preset (default export) or the whole namespace
  const candidate = bundled?.config
  if (!candidate || typeof candidate !== 'object') return undefined

  if ((candidate as any).name === libPresetName) return 'default'

  for (const [key, value] of Object.entries(candidate)) {
    if (key === 'default') continue
    if (value && typeof value === 'object' && (value as any).name === libPresetName) {
      return key
    }
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
