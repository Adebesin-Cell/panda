import { omit, pick, traverse } from '@pandacss/shared'
import type { Config, PandaHooks, Preset } from '@pandacss/types'
import { dirname, isAbsolute, join } from 'node:path'
import { bundle } from './bundle-config'
import { readLibManifest } from './lib-manifest'
import { mergeConfigs } from './merge-config'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

const hookUtils = {
  omit,
  pick,
  traverse,
}

/** Known top-level keys that appear on a Preset/Config object. */
const PRESET_KEYS = new Set([
  'name',
  'theme',
  'conditions',
  'utilities',
  'patterns',
  'presets',
  'globalCss',
  'globalVars',
  'globalFontface',
  'globalPositionTry',
  'staticCss',
  'themes',
  'layers',
])

/**
 * When a preset file only has named exports (no default export), `bundle` returns the entire
 * module object (e.g. `{ leafPreset: <Preset> }`). This helper detects that case and extracts
 * the first value that looks like a preset.
 */
function extractPresetFromModule(mod: unknown): ExtendableConfig {
  if (!mod || typeof mod !== 'object') return mod as ExtendableConfig
  const obj = mod as Record<string, unknown>
  // If the object itself looks like a preset (has at least one known key), use it directly.
  if (Object.keys(obj).some((k) => PRESET_KEYS.has(k))) return obj as ExtendableConfig
  // Otherwise, assume it's a module namespace — return the first value that looks like a preset.
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object' && Object.keys(val as object).some((k) => PRESET_KEYS.has(k))) {
      return val as ExtendableConfig
    }
  }
  // Fallback: return as-is
  return obj as ExtendableConfig
}

/**
 * Recursively merge all presets into a single config (depth-first using stack)
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string, hooks?: Partial<PandaHooks>) {
  if (config.designSystem) {
    const { manifest, manifestPath } = readLibManifest(config.designSystem, cwd)

    // Resolve the manifest's preset path against the manifest's directory
    const presetPath = isAbsolute(manifest.preset) ? manifest.preset : join(dirname(manifestPath), manifest.preset)

    // Bundle and load the preset module
    const presetModule = await bundle(presetPath, cwd)
    // `bundle` returns `mod?.default ?? mod`. If the file only has named exports (no default),
    // the result is the whole module object, e.g. { leafPreset: <Preset> }. In that case we
    // pick the first value that looks like a preset/config (has at least one known preset key).
    const designSystemPreset = extractPresetFromModule(presetModule.config)

    // Prepend to the consumer's presets so it's in the stack
    config.presets = [designSystemPreset, ...(config.presets ?? [])]

    // Concat the manifest's importMap entry into the consumer's importMap.
    const consumerImportMap = config.importMap
    if (consumerImportMap === undefined) {
      config.importMap = manifest.importMap
    } else if (Array.isArray(consumerImportMap)) {
      config.importMap = [...consumerImportMap, manifest.importMap]
    } else {
      config.importMap = [consumerImportMap, manifest.importMap]
    }
  }

  const stack: ExtendableConfig[] = [config]
  const configs: ExtendableConfig[] = []

  while (stack.length > 0) {
    const current = stack.pop()!

    const subPresets = current.presets ?? []
    for (const subPreset of subPresets) {
      let presetConfig: ExtendableConfig
      let presetName: string

      if (typeof subPreset === 'string') {
        const presetModule = await bundle(subPreset, cwd)
        presetConfig = presetModule.config
        presetName = subPreset
      } else {
        presetConfig = await subPreset
        presetName = (presetConfig as any).name || 'unknown-preset'
      }

      // Call preset:resolved hook if available
      if (hooks?.['preset:resolved']) {
        const resolvedPreset = await hooks['preset:resolved']({
          preset: presetConfig as any,
          name: presetName,
          utils: hookUtils,
        })

        if (resolvedPreset !== undefined) {
          presetConfig = resolvedPreset as ExtendableConfig
        }
      }

      stack.push(presetConfig)
    }

    configs.unshift(current)
  }

  const merged = mergeConfigs(configs) as Config

  // Keep the resolved presets so we can find the origin of a token
  merged.presets = configs.slice(0, -1) as Preset[]

  return merged
}
