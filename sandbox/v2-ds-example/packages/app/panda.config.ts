import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-example/lib',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: '@v2-ds-example/styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#ec4899' }, // consumer override — wins over lib's #3b82f6
        },
      },
    },
  },
})
