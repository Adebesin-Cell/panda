import { fixtureDefaults } from '@pandacss/fixture'
import { PandaContext } from '@pandacss/node'
import type { LoadConfigResult, Preset } from '@pandacss/types'
import { expect, test } from 'vitest'
import { generateTokenTypes } from '../src/artifacts/types/token-types'

/**
 * Verifies that:
 *   (a) the `_externalPresets` WeakSet survives `Context` construction (Task 5a),
 *   (b) `generateTokenTypes` filters out token keys/categories matched by
 *       external presets' `internal.tokens` patterns (Task 5b).
 *
 * Strategy: bypass `@pandacss/fixture`'s `createContext` because it spreads
 * the config through `Object.assign`, which strips non-enumerable properties
 * — defeating the very property we're testing. Instead, build a
 * `LoadConfigResult` by hand, attach `_externalPresets` as non-enumerable on
 * `config`, and construct `PandaContext` directly. This exercises Task 5a's
 * preservation path end-to-end: if Context didn't re-attach the property
 * after `defaults()` spread, the filter would never see it and the test
 * would fail.
 */

function buildConf(externalPreset: Preset, options: { external: boolean }): LoadConfigResult {
  // Shallow-clone the live config object (preserves any function references)
  const baseConfig: any = { ...fixtureDefaults.config }
  baseConfig.presets = [...((fixtureDefaults.config as any).presets ?? []), externalPreset]

  if (options.external) {
    const externalPresets = new WeakSet<object>()
    externalPresets.add(externalPreset)
    Object.defineProperty(baseConfig, '_externalPresets', {
      value: externalPresets,
      enumerable: false,
      writable: false,
      configurable: false,
    })
  }

  return {
    ...fixtureDefaults,
    config: baseConfig,
  }
}

test('Context preserves _externalPresets across defaults() spread', () => {
  const preset: Preset = { internal: { tokens: ['colors.gray.*'] } }
  const conf = buildConf(preset, { external: true })
  const expected = (conf.config as any)._externalPresets

  const ctx = new PandaContext(conf)

  // The non-enumerable property should still be reachable on the post-construction config.
  expect((ctx.config as any)._externalPresets).toBe(expected)
})

test('[dts] filter hides tokens matched by external preset internal.tokens', () => {
  const preset: Preset = { internal: { tokens: ['colors.gray.*'] } }
  const ctx = new PandaContext(buildConf(preset, { external: true }))
  const output = generateTokenTypes(ctx)

  // gray.* color tokens should be filtered out
  expect(output).not.toMatch(/"gray\.500"/)
  expect(output).not.toMatch(/"gray\.700"/)
  // other tokens remain
  expect(output).toMatch(/"primary"/)
  expect(output).toMatch(/colors: ColorToken/)
})

test('[dts] filter that removes every token in a category drops the category', () => {
  const preset: Preset = { internal: { tokens: ['breakpoints.*'] } }
  const ctx = new PandaContext(buildConf(preset, { external: true }))
  const output = generateTokenTypes(ctx)

  expect(output).not.toMatch(/BreakpointToken/)
  expect(output).not.toMatch(/breakpoints: /)
})

test('[dts] semanticTokens field filters tokens whose extensions.isSemantic is true', () => {
  // The fixture declares `colors.primary` under `theme.semanticTokens` — so the
  // dictionary tags it with extensions.isSemantic === true via `processSemantic`.
  // Verifying via the public API rather than mutating the token in place keeps
  // this test honest about Task 8 / Gap 1.
  const preset: Preset = { internal: { semanticTokens: ['colors.primary'] } }
  const ctx = new PandaContext(buildConf(preset, { external: true }))

  const colorsMap = ctx.tokens.view.categoryMap.get('colors' as any)
  const primary = colorsMap?.get('primary')
  expect(primary).toBeDefined()
  // Gap 1: base-call inside processSemantic now tags isSemantic.
  expect(primary!.extensions.isSemantic).toBe(true)

  const output = generateTokenTypes(ctx)

  // `colors.primary` is routed via `semanticTokens` and matches the rule -> filtered.
  expect(output).not.toMatch(/"primary"/)
  // A regular (non-semantic) gray token isn't routed through `semanticTokens`.
  expect(output).toMatch(/"gray\.500"/)
})

test('[dts] `tokens` rule does NOT filter a token whose isSemantic is true', () => {
  // `colors.primary` is semantic via the fixture. A `tokens` rule that targets
  // it must NOT filter it because it routes via `semanticTokens`.
  const preset: Preset = { internal: { tokens: ['colors.primary', 'colors.gray.700'] } }
  const ctx = new PandaContext(buildConf(preset, { external: true }))

  const output = generateTokenTypes(ctx)

  // `primary` is semantic — `tokens` rule does not apply -> kept.
  expect(output).toMatch(/"primary"/)
  // `gray.700` is a regular token — `tokens` rule applies -> filtered.
  expect(output).not.toMatch(/"gray\.700"/)
})

test('[dts] ColorPalette union drops palettes whose every token is hidden', () => {
  // Hide every gray token via the `tokens` rule. The `gray` palette has no
  // visible members left -> drop it from the ColorPalette union.
  const preset: Preset = { internal: { tokens: ['colors.gray.*'] } }
  const ctx = new PandaContext(buildConf(preset, { external: true }))
  const output = generateTokenTypes(ctx)

  // Extract the ColorPalette union (single line).
  const match = output.match(/export type ColorPalette = ([^\n]+)/)
  expect(match).not.toBeNull()
  const union = match![1]
  expect(union).not.toMatch(/['"`]gray['"`]/)
  // Other palettes should remain.
  expect(union).toMatch(/['"`]red['"`]/)
})

test('[dts] ColorPalette union keeps palettes with at least one visible token', () => {
  // Hide only some gray tokens. The palette still has visible members -> keep.
  const preset: Preset = { internal: { tokens: ['colors.gray.500'] } }
  const ctx = new PandaContext(buildConf(preset, { external: true }))
  const output = generateTokenTypes(ctx)

  const match = output.match(/export type ColorPalette = ([^\n]+)/)
  expect(match).not.toBeNull()
  const union = match![1]
  expect(union).toMatch(/['"`]gray['"`]/)
})

test('[dts] presets via `presets:[]` (not external) are NOT filtered', () => {
  const preset: Preset = { internal: { tokens: ['colors.gray.*'] } }
  const ctx = new PandaContext(buildConf(preset, { external: false }))
  const output = generateTokenTypes(ctx)

  // gray tokens should remain because the preset isn't in _externalPresets
  expect(output).toMatch(/"gray\.500"/)
})
