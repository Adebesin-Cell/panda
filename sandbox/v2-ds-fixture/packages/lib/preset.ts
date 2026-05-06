import { definePreset } from '@pandacss/dev'

export const acmePreset = definePreset({
  name: '@v2-ds-fixture/lib/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#ff5722' },
        },
      },
      keyframes: {
        acmeFade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      recipes: {
        button: {
          className: 'acme-button',
          base: { px: '4', py: '2', borderRadius: '4px' },
          variants: {
            visual: {
              solid: { bg: 'brand', color: 'white' },
              outline: { borderWidth: '1px', borderColor: 'brand', color: 'brand' },
            },
          },
        },
      },
    },
  },
})
