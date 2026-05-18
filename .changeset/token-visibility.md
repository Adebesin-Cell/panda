---
'@pandacss/types': minor
'@pandacss/config': minor
'@pandacss/core': minor
'@pandacss/generator': minor
'@pandacss/token-dictionary': patch
'@pandacss/shared': patch
---

add `internal` field on presets to mark tokens, semanticTokens, recipes, patterns, conditions, and keyframes as private to the design system package.

paths listed in `internal` are stripped from the generated type surface (literal unions, `Tokens`, `ColorPalette`, recipe/pattern/condition keys) when the preset is consumed via `designSystem`. inside the lib package itself nothing is hidden, so raw and component layers stay usable for building semantic tokens and components.

filter only applies to presets reached through `designSystem` (external). presets imported directly via `presets:[]` are user-controlled and never filtered.

paths support single-segment `*` wildcard (`'colors.raw.*'`).

```ts
definePreset({
  name: '@acme/ds/preset',
  theme: { extend: { tokens: { colors: { /* raw + semantic */ } } } },
  internal: {
    tokens: ['colors.raw.*'],
    recipes: ['internalBase.*'],
  },
})
```

type-level enforcement is only complete with `strictTokens: true` on the consumer config. without it, internal paths are absent from autocomplete but TypeScript still accepts arbitrary strings.
