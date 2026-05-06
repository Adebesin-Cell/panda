import { defineConfig } from '@pandacss/dev'
import { examplePreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', examplePreset],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  importMap: '@v2-ds-example/styled-system',
  outdir: '@v2-ds-example/styled-system',
})
