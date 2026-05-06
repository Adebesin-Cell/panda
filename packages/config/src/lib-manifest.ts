import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { isObject } from '@pandacss/shared'
import type { LibManifest } from '@pandacss/types'

export interface ReadLibManifestResult {
  manifest: LibManifest
  manifestPath: string
}

/**
 * Module-scope memoization. `readLibManifest` is called from both
 * `getResolvedConfig` and `createContext` for the same package per
 * panda invocation. Cache by `cwd::packageName` to read each manifest
 * once.
 */
const cache = new Map<string, ReadLibManifestResult>()

/**
 * Resolves `<packageName>/panda.lib.json` via Node module resolution
 * starting from `cwd`, reads the manifest, validates it, and returns the
 * parsed manifest plus the absolute path to the file.
 *
 * Throws if:
 * - The package can't be resolved from `cwd`
 * - The package doesn't expose `./panda.lib.json` in its `exports`
 * - The file isn't valid JSON
 * - The JSON doesn't conform to the LibManifest shape
 */
export function readLibManifest(packageName: string, cwd: string): ReadLibManifestResult {
  const cacheKey = `${cwd}::${packageName}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const require = createRequire(join(cwd, 'noop.js'))

  let manifestPath: string
  try {
    manifestPath = require.resolve(`${packageName}/panda.lib.json`)
  } catch (error) {
    throw new Error(
      `Cannot resolve '${packageName}/panda.lib.json' from '${cwd}'. ` +
        `The package must be installed and its package.json must expose ` +
        `'./panda.lib.json' in its 'exports' map.`,
      { cause: error },
    )
  }

  const raw = readFileSync(manifestPath, 'utf-8')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Invalid JSON in '${manifestPath}'.`, { cause: error })
  }

  const manifest = validate(parsed, manifestPath)
  const result = { manifest, manifestPath }
  cache.set(cacheKey, result)
  return result
}

function validate(value: unknown, path: string): LibManifest {
  if (!isObject(value)) {
    throw new Error(`Manifest at '${path}' must be an object.`)
  }

  const required: Array<keyof LibManifest> = [
    'schemaVersion',
    'name',
    'version',
    'panda',
    'preset',
    'importMap',
    'buildinfo',
  ]
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`Manifest at '${path}' is missing required field '${key}'.`)
    }
  }

  const v = value as Record<string, unknown>

  if (typeof v.schemaVersion !== 'number' || !Number.isInteger(v.schemaVersion)) {
    throw new Error(`Manifest at '${path}': 'schemaVersion' must be an integer.`)
  }
  if (typeof v.name !== 'string') {
    throw new Error(`Manifest at '${path}': 'name' must be a string.`)
  }
  if (typeof v.version !== 'string') {
    throw new Error(`Manifest at '${path}': 'version' must be a string.`)
  }
  if (typeof v.panda !== 'string') {
    throw new Error(`Manifest at '${path}': 'panda' must be a string.`)
  }
  if (typeof v.preset !== 'string') {
    throw new Error(`Manifest at '${path}': 'preset' must be a string.`)
  }
  if (typeof v.buildinfo !== 'string') {
    throw new Error(`Manifest at '${path}': 'buildinfo' must be a string.`)
  }
  if (!isObject(v.importMap)) {
    throw new Error(`Manifest at '${path}': 'importMap' must be an object.`)
  }
  if (v.files !== undefined && !Array.isArray(v.files)) {
    throw new Error(`Manifest at '${path}': 'files' must be an array if present.`)
  }

  return v as unknown as LibManifest
}
