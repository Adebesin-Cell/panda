import { defineConfig } from '@pandacss/dev'
import { leafPreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', leafPreset],
  designSystem: '@v2-ds-fixture/lib-mid',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  importMap: '@v2-ds-fixture/styled-system',
  outdir: '@v2-ds-fixture/styled-system',
})
