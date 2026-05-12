import { definePreset } from '@pandacss/dev'

export const midPreset = definePreset({
  name: '@v2-ds-fixture/lib-mid/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#0066ff' }, // override base's #ff5722
          surface: { value: '#fafafa' }, // new in mid
        },
      },
      recipes: {
        card: {
          className: 'mid-card',
          base: { bg: 'surface', borderRadius: '8px', p: '4' },
        },
      },
    },
  },
})
