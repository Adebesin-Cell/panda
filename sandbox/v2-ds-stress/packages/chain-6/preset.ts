import { definePreset } from '@pandacss/dev'

export const chain6Preset = definePreset({
  name: '@v2-ds-stress/chain-6/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          tier6: { value: '#666666' },
        },
      },
      recipes: {
        tier6Card: {
          className: 'tier-6-card',
          base: { bg: 'tier6', p: '4', borderRadius: '8px' },
        },
      },
    },
  },
})
