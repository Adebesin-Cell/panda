import { definePreset } from '@pandacss/dev'

export const chain3Preset = definePreset({
  name: '@v2-ds-stress/chain-3/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier3: { value: '#333333' },
        },
      },
      recipes: {
        tier3Card: {
          className: 'tier-3-card',
          base: { bg: 'tier3', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
