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

/**
 * Recursively merge all presets into a single config (depth-first using stack)
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string, hooks?: Partial<PandaHooks>) {
  if (config.designSystem) {
    const { manifest, manifestPath } = readLibManifest(config.designSystem, cwd)

    const presetPath = isAbsolute(manifest.preset) ? manifest.preset : join(dirname(manifestPath), manifest.preset)
    const presetModule = await bundle(presetPath, cwd)
    const exportName = manifest.presetExport ?? 'default'

    const moduleObj = (presetModule.config ?? presetModule) as Record<string, unknown>
    let designSystemPreset = moduleObj[exportName] as Preset | undefined

    if (!designSystemPreset && exportName === 'default') {
      designSystemPreset = moduleObj as unknown as Preset
    }

    if (!designSystemPreset) {
      throw new Error(
        `designSystem '${config.designSystem}': preset file does not export '${exportName}'. ` +
          `Check the manifest's 'presetExport' field or that the preset file has a default export.`,
      )
    }

    config.presets = [designSystemPreset, ...(config.presets ?? [])]

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

  // Cycle detection. Tracks preset identity by name (for string specifiers and
  // named preset objects) and falls back to object reference. Without this,
  // a preset whose `presets` array transitively references itself would loop
  // forever.
  const seenNames = new Set<string>()
  const seenRefs = new WeakSet<object>()

  while (stack.length > 0) {
    const current = stack.pop()!

    const subPresets = current.presets ?? []
    for (const subPreset of subPresets) {
      let presetConfig: ExtendableConfig
      let presetName: string

      if (typeof subPreset === 'string') {
        if (seenNames.has(subPreset)) continue
        const presetModule = await bundle(subPreset, cwd)
        presetConfig = presetModule.config
        presetName = subPreset
      } else {
        presetConfig = await subPreset
        presetName = (presetConfig as any).name || 'unknown-preset'
      }

      const namedKey = (presetConfig as any)?.name as string | undefined
      if (namedKey && seenNames.has(namedKey)) continue
      if (typeof presetConfig === 'object' && presetConfig !== null && seenRefs.has(presetConfig)) continue

      seenNames.add(presetName)
      if (namedKey) seenNames.add(namedKey)
      if (typeof presetConfig === 'object' && presetConfig !== null) seenRefs.add(presetConfig)

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
