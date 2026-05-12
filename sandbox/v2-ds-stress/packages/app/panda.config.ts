import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  strictTokens: true,
  designSystem: '@v2-ds-stress/atlas-lib',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
