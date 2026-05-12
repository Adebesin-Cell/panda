import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  strictTokens: true,
  designSystem: '@v2-ds-fixture/lib-leaf',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#ff00ff' }, // consumer override
        },
      },
    },
  },
})
