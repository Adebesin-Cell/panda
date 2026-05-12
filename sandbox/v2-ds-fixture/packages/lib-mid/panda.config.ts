import { defineConfig } from '@pandacss/dev'
import { midPreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', midPreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
