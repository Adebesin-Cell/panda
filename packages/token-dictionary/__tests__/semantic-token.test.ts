import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('semantic tokens / duplicate token references with special characters', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      sizes: {
        0.5: { value: '0.125rem' },
      },
    },
    semanticTokens: {
      shadows: {
        controlAccent: {
          value: '0 {sizes.0.5} {sizes.0.5} rgba(92, 225, 113, 0.25)',
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.view.vars.get('base')?.get('--shadows-control-accent')).toMatchInlineSnapshot(
    `"0 var(--sizes-0\\.5) var(--sizes-0\\.5) rgba(92, 225, 113, 0.25)"`,
  )
})

test('semantic tokens / deeply nested', () => {
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        pink: { value: { base: '#fff', osDark: { highCon: 'sdfdfsd' } } },
      },
    },
  })

  dictionary.registerTokens()
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "conditions": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
          "isSemantic": true,
          "prop": "pink",
          "rawValue": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
        },
        "name": "colors.pink",
        "originalValue": "#fff",
        "path": [
          "colors",
          "pink",
        ],
        "type": "color",
        "value": "#fff",
      },
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "osDark:highCon",
          "conditions": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
          "isSemantic": true,
          "prop": "pink",
          "rawValue": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
        },
        "name": "colors.pink",
        "originalValue": "#fff",
        "path": [
          "colors",
          "pink",
        ],
        "type": "color",
        "value": "sdfdfsd",
      },
    ]
  `)
})

test('semantic tokens / base node carries extensions.isSemantic', () => {
  // Gap 1 of Task 8: every token created via `processSemantic` (i.e. every
  // entry under `theme.semanticTokens`) must be tagged with `isSemantic: true`
  // so downstream filters (e.g. token-types.ts) can route via the
  // `semanticTokens` field instead of `tokens`.
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        brand: { value: { base: '#fff', _dark: '#000' } },
      },
    },
  })

  dictionary.registerTokens()
  dictionary.build()

  const brand = dictionary.allTokens.find((t) => t.name === 'colors.brand')
  expect(brand).toBeDefined()
  expect(brand!.extensions.isSemantic).toBe(true)
})
