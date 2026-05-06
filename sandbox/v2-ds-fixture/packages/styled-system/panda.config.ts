import { defineConfig } from '@pandacss/dev'
import { leafPreset } from '../lib-leaf/preset'

export default defineConfig({
  preflight: true,
  // Import the leaf preset (which transitively chains through mid → base
  // via Preset.presets). This makes the workspace styled-system package's
  // codegen emit recipes/ for all three levels, so any lib's TypeScript
  // import 'from @v2-ds-fixture/styled-system/recipes' resolves through
  // pnpm to a workspace package that actually has the subpath.
  presets: ['@pandacss/dev/presets', leafPreset],
  include: [],
  exclude: [],
  outdir: '.',
  emitPackage: true,
})
