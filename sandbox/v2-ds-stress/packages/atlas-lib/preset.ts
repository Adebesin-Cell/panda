import { definePreset } from '@pandacss/dev'
import { preset as atlaskit } from '@pandacss/preset-atlaskit'

export const atlasPreset = definePreset({
  name: '@v2-ds-stress/atlas-lib/preset',
  presets: [atlaskit],
})
