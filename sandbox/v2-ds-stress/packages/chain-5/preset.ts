import { definePreset } from '@pandacss/dev'

export const chain5Preset = definePreset({
  name: '@v2-ds-stress/chain-5/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier5: { value: '#555555' },
        },
      },
      recipes: {
        tier5Card: {
          className: 'tier-5-card',
          base: { bg: 'tier5', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
