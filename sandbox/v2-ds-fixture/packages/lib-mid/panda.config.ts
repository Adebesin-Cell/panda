import { defineConfig } from '@pandacss/dev'
import { midPreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', midPreset],
  include: [
    './node_modules/@v2-ds-fixture/lib/dist/panda.buildinfo.json',
    './src/**/*.{ts,tsx}',
  ],
  exclude: [],
  importMap: '@v2-ds-fixture/styled-system',
  outdir: '@v2-ds-fixture/styled-system',
})
