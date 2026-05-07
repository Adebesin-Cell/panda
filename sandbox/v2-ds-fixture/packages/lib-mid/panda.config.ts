import { defineConfig } from '@pandacss/dev'
import { midPreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', midPreset],
  designSystem: '@v2-ds-fixture/lib',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  importMap: '@v2-ds-fixture/styled-system',
  outdir: '@v2-ds-fixture/styled-system',
})
