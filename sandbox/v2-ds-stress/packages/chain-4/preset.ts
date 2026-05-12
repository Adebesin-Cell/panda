import { definePreset } from '@pandacss/dev'

export const chain4Preset = definePreset({
  name: '@v2-ds-stress/chain-4/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier4: { value: '#444444' },
        },
      },
      recipes: {
        tier4Card: {
          className: 'tier-4-card',
          base: { bg: 'tier4', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
