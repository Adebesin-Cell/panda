import { describe, expect, test } from 'vitest'
import { matchTokenPath } from '../src/match-token-path'

describe('matchTokenPath', () => {
  test('exact match', () => {
    expect(matchTokenPath('colors.brand', ['colors.brand'])).toBe(true)
    expect(matchTokenPath('colors.brand', ['colors.accent'])).toBe(false)
  })

  test('single-segment wildcard', () => {
    expect(matchTokenPath('colors.gray.500', ['colors.gray.*'])).toBe(true)
    expect(matchTokenPath('colors.gray', ['colors.gray.*'])).toBe(false)
    expect(matchTokenPath('colors.gray.500.alpha', ['colors.gray.*'])).toBe(false)
  })

  test('wildcard does not cross dot boundary', () => {
    expect(matchTokenPath('colors.gray.500', ['colors.*'])).toBe(false)
    expect(matchTokenPath('colors.gray', ['colors.*'])).toBe(true)
  })

  test('OR across patterns', () => {
    expect(matchTokenPath('spacing.4', ['colors.*', 'spacing.*'])).toBe(true)
  })

  test('empty patterns array returns false', () => {
    expect(matchTokenPath('anything', [])).toBe(false)
  })

  test('escapes regex specials in literal path segments', () => {
    expect(matchTokenPath('colors.brand+special', ['colors.brand+special'])).toBe(true)
    expect(matchTokenPath('colors.brandXspecial', ['colors.brand+special'])).toBe(false)
  })
})
