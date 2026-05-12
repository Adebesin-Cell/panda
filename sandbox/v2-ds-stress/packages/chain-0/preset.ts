import { definePreset } from '@pandacss/dev'

export const chain0Preset = definePreset({
  name: '@v2-ds-stress/chain-0/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier0: { value: '#ff5722' },
        },
      },
      recipes: {
        tier0Card: {
          className: 'tier-0-card',
          base: { bg: 'tier0', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
