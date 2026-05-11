import { describe, expect, test } from 'vitest'
import { createVisibilityFilter } from '../src/visibility'

describe('createVisibilityFilter', () => {
  test('returns a no-op when config has no _externalPresets', () => {
    const isHidden = createVisibilityFilter({ presets: [] } as any)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(false)
  })

  test('returns a no-op when no external preset has an internal block', () => {
    const preset = { name: 'ds' } as any
    const externals = new WeakSet<object>([preset])
    const config = { presets: [preset] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(false)
  })

  test('hides paths matched by an external preset internal block', () => {
    const preset = {
      name: 'ds',
      internal: { tokens: ['colors.gray.*'] },
    } as any
    const externals = new WeakSet<object>([preset])
    const config = { presets: [preset] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(true)
    expect(isHidden('tokens', 'colors.brand')).toBe(false)
  })

  test('does not hide paths from non-external presets even when they declare internal', () => {
    const userPreset = {
      name: 'user',
      internal: { tokens: ['colors.gray.*'] },
    } as any
    const externals = new WeakSet<object>() // userPreset NOT in set
    const config = { presets: [userPreset] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(false)
  })

  test('OR-merges internal blocks across multiple external presets', () => {
    const dsA = { internal: { tokens: ['colors.gray.*'] } } as any
    const dsB = { internal: { tokens: ['colors.red.*'] } } as any
    const externals = new WeakSet<object>([dsA, dsB])
    const config = { presets: [dsA, dsB] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(true)
    expect(isHidden('tokens', 'colors.red.500')).toBe(true)
    expect(isHidden('tokens', 'colors.brand')).toBe(false)
  })
})
