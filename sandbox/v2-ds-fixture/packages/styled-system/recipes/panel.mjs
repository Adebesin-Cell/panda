import { memo, splitProps } from '../helpers.mjs';
import { createRecipe, mergeRecipes } from './create-recipe.mjs';

const panelFn = /* @__PURE__ */ createRecipe('leaf-panel', {}, [])

const panelVariantMap = {}

const panelVariantKeys = Object.keys(panelVariantMap)

export const panel = /* @__PURE__ */ Object.assign(memo(panelFn.recipeFn), {
  __recipe__: true,
  __name__: 'panel',
  __getCompoundVariantCss__: panelFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: panelVariantKeys,
  variantMap: panelVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, panelVariantKeys)
  },
  getVariantProps: panelFn.getVariantProps,
})