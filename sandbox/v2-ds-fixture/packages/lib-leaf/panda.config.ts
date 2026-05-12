import { defineConfig } from '@pandacss/dev'
import { leafPreset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-fixture/lib-mid',
  presets: ['@pandacss/dev/presets', leafPreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
