import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { LibManifest } from '@pandacss/types'

export interface WriteLibManifestOptions {
  cwd: string
  outdir: string
  preset: string
  buildinfo: string
  importMap: LibManifest['importMap']
  files?: string[]
  schemaVersion?: number
  /** Pre-resolved @pandacss/dev version. Skips the node_modules walk. */
  pandaVersion?: string
  /** Pre-parsed package.json. Skips disk read. */
  pkg?: {
    name?: string
    version?: string
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }
  /** Name of the preset's export. Defaults to 'default' downstream when omitted. */
  presetExport?: string
}

export interface WriteLibManifestResult {
  manifestPath: string
  manifest: LibManifest
}

const DEFAULT_SCHEMA_VERSION = 1

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
    ...(options.presetExport !== undefined ? { presetExport: options.presetExport } : {}),
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
  if (!declared || declared.startsWith('workspace:') || declared.includes('catalog:')) {
    const installedVersion = providedVersion ?? lookupInstalledPandaVersion(cwd)
    if (installedVersion) {
      const major = installedVersion.split('.')[0]
      if (major) {
        return `^${major}.0.0`
      }
    }
    return '*'
  }
  return declared
}

function lookupInstalledPandaVersion(cwd: string): string | undefined {
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
