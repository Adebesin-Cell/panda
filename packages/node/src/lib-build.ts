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

  ctx.config.libraryMode = true

  const buildinfoOutfile = join(cwd, outdir, 'panda.buildinfo.json')
  await buildInfo(ctx, buildinfoOutfile)

  const pkgPath = join(cwd, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  const presetSourceAbs = isAbsolute(presetSource) ? presetSource : join(cwd, outdir, presetSource)
  const presetOutAbs = join(cwd, outdir, COMPILED_PRESET_FILENAME)
  const presetOutRelManifest = `./${COMPILED_PRESET_FILENAME}`

  const presetCompiled = await compilePreset(presetSourceAbs, presetOutAbs)
  const presetForManifest = presetCompiled ? presetOutRelManifest : presetSource

  const libPresetName = findLibPresetName(ctx.config.presets as any[])
  const presetExport = await detectPresetExport(cwd, outdir, presetForManifest, libPresetName)

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
  })
  logger.info('lib', `wrote ${manifestPath}`)

  patchPackageExports(pkgPath, pkg, outdir, presetCompiled)
}

async function compilePreset(sourceAbs: string, outAbs: string): Promise<boolean> {
  if (!existsSync(sourceAbs)) {
    logger.warn(
      'lib',
      `preset source not found at '${sourceAbs}' — manifest will reference it as-is and consumers must resolve it`,
    )
    return false
  }

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
    return true
  } catch (e) {
    logger.warn(
      'lib',
      `failed to compile preset at '${sourceAbs}': ${String(e)}. manifest will reference the source file instead.`,
    )
    return false
  }
}

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

function patchPackageExports(pkgPath: string, pkg: any, outdir: string, presetCompiled: boolean): void {
  const exports = pkg.exports ?? {}

  const wanted: Record<string, string> = {
    './panda.lib.json': `./${outdir}/panda.lib.json`,
    './panda.buildinfo.json': `./${outdir}/panda.buildinfo.json`,
  }

  if (presetCompiled) {
    wanted['./preset'] = `./${outdir}/${COMPILED_PRESET_FILENAME}`
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
