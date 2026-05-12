import { defineConfig } from '@pandacss/dev'
import { midPreset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-fixture/lib',
  presets: ['@pandacss/dev/presets', midPreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
