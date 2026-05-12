import { definePreset } from '@pandacss/dev'

export const chain2Preset = definePreset({
  name: '@v2-ds-stress/chain-2/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier2: { value: '#222222' },
        },
      },
      recipes: {
        tier2Card: {
          className: 'tier-2-card',
          base: { bg: 'tier2', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
