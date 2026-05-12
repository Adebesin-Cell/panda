import { defineConfig } from '@pandacss/dev'
import { chain5Preset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-stress/chain-4',
  presets: ['@pandacss/dev/presets', chain5Preset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
