import { matchTokenPath } from '@pandacss/shared'
import type { Config, InternalVisibility, Preset } from '@pandacss/types'

type VisibilityField = keyof InternalVisibility

// Note: keyframes is wired through InternalVisibility for forward-compat but has no
// type-side effect today (CssKeyframes is an open index signature).

/**
 * Resolved config carrying the side-channel set of presets reached through
 * `config.designSystem`. Set by `getResolvedConfig` in @pandacss/config.
 * Non-enumerable so it doesn't leak into snapshots or serialization.
 */
interface ResolvedConfigWithVisibility extends Config {
  _externalPresets?: WeakSet<object>
}

/**
 * Builds a predicate that, given a (field, path) pair, returns true when the
 * path should be hidden from the public type/runtime surface.
 *
 * The filter applies only to entries owned by **external** presets — those
 * reached via `config.designSystem` (and transitively their `presets:` chain).
 * Presets reached via `config.presets:[]` directly are user-controlled and
 * never filtered.
 */
export function createVisibilityFilter(config: Config) {
  const { _externalPresets: externalPresets } = config as ResolvedConfigWithVisibility
  const presets = (config.presets ?? []) as Preset[]

  if (!externalPresets) {
    return () => false
  }

  const matchingPresets: Preset[] = []
  for (const preset of presets) {
    if (!externalPresets.has(preset as object)) continue
    if (!(preset as Preset).internal) continue
    matchingPresets.push(preset)
  }

  if (matchingPresets.length === 0) {
    return () => false
  }

  return function isHidden(field: VisibilityField, path: string): boolean {
    for (const preset of matchingPresets) {
      const patterns = preset.internal?.[field]
      if (!patterns || patterns.length === 0) continue
      if (matchTokenPath(path, patterns)) return true
    }
    return false
  }
}

export type VisibilityFilter = ReturnType<typeof createVisibilityFilter>
