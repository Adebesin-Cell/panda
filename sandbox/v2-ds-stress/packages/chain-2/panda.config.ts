import { defineConfig } from '@pandacss/dev'
import { chain2Preset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-stress/chain-1',
  presets: ['@pandacss/dev/presets', chain2Preset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
