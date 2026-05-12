import { defineConfig } from '@pandacss/dev'
import { chain3AltPreset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-stress/chain-2',
  presets: ['@pandacss/dev/presets', chain3AltPreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
