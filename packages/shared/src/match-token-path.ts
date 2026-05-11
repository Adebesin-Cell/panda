/**
 * Matches a dot-path against an array of patterns. `*` in a pattern matches a
 * single segment (anything except `.`). Multiple patterns are OR-ed; matching
 * ANY pattern returns true.
 *
 * Used by the visibility filter to decide whether a token / recipe / etc.
 * path should be hidden from a consumer's type surface.
 *
 * `**` (multi-segment wildcard) is NOT supported. A literal `**` is treated
 * as two consecutive `*`s.
 */
export function matchTokenPath(path: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false
  for (const pattern of patterns) {
    if (patternToRegex(pattern).test(path)) return true
  }
  return false
}

const cache = new Map<string, RegExp>()

function patternToRegex(pattern: string): RegExp {
  const cached = cache.get(pattern)
  if (cached) return cached
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')
  const regex = new RegExp(`^${escaped}$`)
  cache.set(pattern, regex)
  return regex
}
