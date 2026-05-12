import { definePreset } from '@pandacss/dev'

export const chain1Preset = definePreset({
  name: '@v2-ds-stress/chain-1/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier1: { value: '#111111' },
        },
      },
      recipes: {
        tier1Card: {
          className: 'tier-1-card',
          base: { bg: 'tier1', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
