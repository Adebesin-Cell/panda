import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { LibManifest } from '@pandacss/types'

export interface WriteLibManifestOptions {
  /** The library package's root directory (cwd of the panda invocation). */
  cwd: string
  /** Where to write panda.lib.json (relative to cwd). Default: 'dist'. */
  outdir: string
  /** Path to the preset file, relative to the manifest. */
  preset: string
  /** Path to panda.buildinfo.json, relative to the manifest. */
  buildinfo: string
  /** Import map entry the manifest declares. */
  importMap: LibManifest['importMap']
  /** Optional fallback re-extract globs. */
  files?: string[]
  /** Override the manifest schema version. Default: 1. */
  schemaVersion?: number
  /**
   * Pre-resolved @pandacss/dev version (e.g. '2.5.0') to use when
   * normalizing the panda peer range. When provided, skips the
   * filesystem walk for installed version lookup. Useful for callers
   * that memoize the lookup (e.g. `panda lib --watch`).
   */
  pandaVersion?: string
  /**
   * Pre-parsed package.json. When provided, skips the disk read.
   * Useful for callers that already have the package.json parsed
   * (e.g. the `buildLib` orchestrator).
   */
  pkg?: {
    name?: string
    version?: string
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }
}

export interface WriteLibManifestResult {
  manifestPath: string
  manifest: LibManifest
}

const DEFAULT_SCHEMA_VERSION = 1

/**
 * Writes a `panda.lib.json` manifest into `<cwd>/<outdir>/panda.lib.json`.
 *
 * Reads the lib's `package.json` to derive `name`, `version`, and the
 * panda peer range from `devDependencies['@pandacss/dev']`. The peer range
 * is normalized: `workspace:*` becomes `^<major>.0.0` based on the
 * installed @pandacss/dev version (looked up from node_modules); explicit
 * semver ranges pass through.
 */
export function writeLibManifest(options: WriteLibManifestOptions): WriteLibManifestResult {
  const { cwd, outdir, preset, buildinfo, importMap, files, schemaVersion } = options

  const pkgPath = join(cwd, 'package.json')
  let pkg: any
  if (options.pkg) {
    pkg = options.pkg
  } else {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    } catch (error) {
      throw new Error(`Cannot read package.json at '${pkgPath}'.`, { cause: error })
    }
  }

  if (typeof pkg.name !== 'string') {
    throw new Error(`package.json at '${pkgPath}' is missing 'name'.`)
  }
  if (typeof pkg.version !== 'string') {
    throw new Error(`package.json at '${pkgPath}' is missing 'version'.`)
  }

  const declaredPandaRange = pkg.devDependencies?.['@pandacss/dev'] ?? pkg.peerDependencies?.['@pandacss/dev'] ?? ''
  const pandaRange = normalizePandaRange(declaredPandaRange, cwd, options.pandaVersion)

  const manifest: LibManifest = {
    schemaVersion: schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    name: pkg.name,
    version: pkg.version,
    panda: pandaRange,
    preset,
    importMap,
    buildinfo,
    ...(files && files.length > 0 ? { files } : {}),
  }

  const manifestDir = join(cwd, outdir)
  mkdirSync(manifestDir, { recursive: true })

  const manifestPath = join(manifestDir, 'panda.lib.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  return { manifestPath, manifest }
}

function normalizePandaRange(declared: string, cwd: string, providedVersion?: string): string {
  // workspace:* and similar pnpm/yarn-protocols → derive from installed version
  if (!declared || declared.startsWith('workspace:') || declared.includes('catalog:')) {
    const installedVersion = providedVersion ?? lookupInstalledPandaVersion(cwd)
    if (installedVersion) {
      const major = installedVersion.split('.')[0]
      if (major) {
        return `^${major}.0.0`
      }
    }
    // Fall back: just say any version, with a clear marker.
    return '*'
  }
  return declared
}

function lookupInstalledPandaVersion(cwd: string): string | undefined {
  // Walk up from cwd looking for node_modules/@pandacss/dev/package.json
  let dir = cwd
  while (true) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'node_modules', '@pandacss', 'dev', 'package.json'), 'utf-8'))
      const ver = pkg.version
      if (typeof ver === 'string' && ver.length > 0) {
        return ver
      }
      return undefined
    } catch {
      const parent = dirname(dir)
      if (parent === dir) return undefined
      dir = parent
    }
  }
}
