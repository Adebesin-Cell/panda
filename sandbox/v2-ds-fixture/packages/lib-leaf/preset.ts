import { definePreset } from '@pandacss/dev'
import { midPreset } from '@v2-ds-fixture/lib-mid/preset'

export const leafPreset = definePreset({
  name: '@v2-ds-fixture/lib-leaf/preset',
  presets: [midPreset],
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#22cc88' }, // override mid's #0066ff (which overrode base's #ff5722)
          accent: { value: '#9933ff' }, // new in leaf
        },
      },
      recipes: {
        panel: {
          className: 'leaf-panel',
          base: { bg: 'accent', color: 'white', p: '8', borderRadius: '16px' },
        },
      },
    },
  },
})
