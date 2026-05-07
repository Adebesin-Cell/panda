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
 * Recursively merge all presets into a single config (depth-first using stack).
 * The input config is not mutated — `panda lib --watch` reuses the same config
 * across rebuilds and would accumulate prepended designSystem presets otherwise.
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string, hooks?: Partial<PandaHooks>) {
  const root: ExtendableConfig = { ...config }

  if (root.designSystem) {
    const { manifest, manifestPath } = readLibManifest(root.designSystem, cwd)

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
        `designSystem '${root.designSystem}': preset file does not export '${exportName}'. ` +
          `Check the manifest's 'presetExport' field or that the preset file has a default export.`,
      )
    }

    root.presets = [designSystemPreset, ...(root.presets ?? [])]

    const consumerImportMap = root.importMap
    if (consumerImportMap === undefined) {
      root.importMap = manifest.importMap
    } else if (Array.isArray(consumerImportMap)) {
      root.importMap = [...consumerImportMap, manifest.importMap]
    } else {
      root.importMap = [consumerImportMap, manifest.importMap]
    }
  }

  const stack: ExtendableConfig[] = [root]
  const configs: ExtendableConfig[] = []

  // String specifiers dedup by specifier; object presets dedup by identity.
  // Two distinct presets sharing a `name` both flow through.
  const seenStrings = new Set<string>()
  const seenRefs = new WeakSet<object>()

  while (stack.length > 0) {
    const current = stack.pop()!

    const subPresets = current.presets ?? []
    for (const subPreset of subPresets) {
      let presetConfig: ExtendableConfig
      let presetName: string

      if (typeof subPreset === 'string') {
        if (seenStrings.has(subPreset)) continue
        seenStrings.add(subPreset)
        const presetModule = await bundle(subPreset, cwd)
        presetConfig = presetModule.config
        presetName = subPreset
      } else {
        presetConfig = await subPreset
        presetName = (presetConfig as Preset).name || 'unknown-preset'
      }

      if (typeof presetConfig === 'object' && presetConfig !== null) {
        if (seenRefs.has(presetConfig)) continue
        seenRefs.add(presetConfig)
      }

      // Call preset:resolved hook if available
      if (hooks?.['preset:resolved']) {
        const resolvedPreset = await hooks['preset:resolved']({
          preset: presetConfig as Preset,
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
