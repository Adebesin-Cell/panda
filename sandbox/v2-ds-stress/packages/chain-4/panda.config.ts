import { defineConfig } from '@pandacss/dev'
import { chain4Preset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-stress/chain-3',
  presets: ['@pandacss/dev/presets', chain4Preset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
