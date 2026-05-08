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
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  const presetSourceAbs = resolvePresetSource(cwd, outdir, presetSource)
  const presetOutAbs = join(cwd, outdir, COMPILED_PRESET_FILENAME)
  const presetOutRelManifest = `./${COMPILED_PRESET_FILENAME}`

  await compilePreset(presetSourceAbs, presetOutAbs)
  const presetForManifest = presetOutRelManifest

  const libPresetName = findLibPresetName(ctx.config.presets)
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

function findLibPresetName(presets: unknown[] | undefined): string | undefined {
  if (!Array.isArray(presets)) return undefined

  const builtinNames = new Set(['@pandacss/preset-base', '@pandacss/preset-panda'])

  for (let i = presets.length - 1; i >= 0; i--) {
    const p = presets[i]
    if (!p || typeof p !== 'object') continue
    const name = (p as { name?: unknown }).name
    if (typeof name === 'string' && !builtinNames.has(name)) return name
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
  if ((candidateRecord.name as string | undefined) === libPresetName) return 'default'

  for (const [key, value] of Object.entries(candidateRecord)) {
    if (key === 'default') continue
    if (value && typeof value === 'object' && (value as { name?: string }).name === libPresetName) {
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
    './preset': `./${outdir}/${COMPILED_PRESET_FILENAME}`,
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
