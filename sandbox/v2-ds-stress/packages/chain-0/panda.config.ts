import { defineConfig } from '@pandacss/dev'
import { chain0Preset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', chain0Preset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
