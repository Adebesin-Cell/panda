import { defineConfig } from '@pandacss/dev'
import { leafPreset } from './preset'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', leafPreset],
  include: [
    './node_modules/@v2-ds-fixture/lib-mid/dist/panda.buildinfo.json',
    './src/**/*.{ts,tsx}',
  ],
  exclude: [],
  importMap: '@v2-ds-fixture/styled-system',
  outdir: '@v2-ds-fixture/styled-system',
})
