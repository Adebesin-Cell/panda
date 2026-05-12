import { defineConfig } from '@pandacss/dev'
import { chain6Preset } from './preset'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-stress/chain-5',
  presets: ['@pandacss/dev/presets', chain6Preset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './styled-system',
})
