import { defineConfig } from '@pandacss/dev'
import { chain1Preset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-stress/chain-0',
  presets: ['@pandacss/dev/presets', chain1Preset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
