import { defineConfig } from '@pandacss/dev'
import { examplePreset } from '../lib/preset'

export default defineConfig({
  preflight: true,
  // Import the design-system preset so this workspace package's codegen
  // emits the recipes/ directory. Without this, lib code that imports
  // from '@v2-ds-example/styled-system/recipes' fails to type-check
  // because the workspace package only has css/tokens/patterns/types.
  presets: ['@pandacss/dev/presets', examplePreset],
  include: [],
  exclude: [],
  outdir: '.',
  emitPackage: true,
})
