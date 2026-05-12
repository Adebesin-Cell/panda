import { definePreset } from '@pandacss/dev'

export const chain3AltPreset = definePreset({
  name: '@v2-ds-stress/chain-3-alt/preset',
  theme: {
    extend: {
      tokens: {
        colors: { tier3Alt: { value: '#abcdef' } },
      },
      recipes: {
        tier3AltCard: {
          className: 'tier-3-alt-card',
          base: { bg: 'tier3Alt', p: '4' },
        },
      },
    },
  },
})
