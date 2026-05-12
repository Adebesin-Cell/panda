import { defineConfig } from '@pandacss/dev'
import { acmePreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', acmePreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
