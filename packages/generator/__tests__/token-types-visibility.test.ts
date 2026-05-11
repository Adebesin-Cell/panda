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

test('[dts] presets via `presets:[]` (not external) are NOT filtered', () => {
  const preset: Preset = { internal: { tokens: ['colors.gray.*'] } }
  const ctx = new PandaContext(buildConf(preset, { external: false }))
  const output = generateTokenTypes(ctx)

  // gray tokens should remain because the preset isn't in _externalPresets
  expect(output).toMatch(/"gray\.500"/)
})
