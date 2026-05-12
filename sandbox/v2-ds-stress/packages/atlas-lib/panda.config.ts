import { defineConfig } from '@pandacss/dev'
import { atlasPreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', atlasPreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
