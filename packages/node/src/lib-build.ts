import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
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
  })
  logger.info('lib', `wrote ${manifestPath}`)

  // Step 3: patch package.json exports
  patchPackageExports(pkgPath, pkg, outdir)
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
