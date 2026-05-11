import { createVisibilityFilter, type Context } from '@pandacss/core'
import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'

const categories = [
  'aspectRatios',
  'zIndex',
  'opacity',
  'colors',
  'fonts',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'sizes',
  'cursor',
  'shadows',
  'spacing',
  'radii',
  'borders',
  'borderWidths',
  'durations',
  'easings',
  'animations',
  'blurs',
  'gradients',
  'breakpoints',
  'assets',
]

export function generateTokenTypes(ctx: Context) {
  const { tokens } = ctx
  const isHidden = createVisibilityFilter(ctx.config)

  const set = new Set<string>()

  const tokenSet = new Set<string>()

  const result = new Set<string>(['export type Tokens = {'])

  if (tokens.isEmpty) {
    result.add('[token: string]: string')
  } else {
    // Drop a palette from the union only when EVERY real token belonging to it
    // is hidden. We discover members by scanning the `colors` category for
    // non-virtual tokens whose `extensions.colorPaletteRoots` (formatted via
    // dot-join) includes the palette key — mirroring the same logic that
    // `getTokensView` uses to populate `colorPalettes` in the first place.
    const colorsCategory = tokens.view.categoryMap.get('colors' as any)
    const tokenBelongsToPalette = (token: any, paletteKey: string): boolean => {
      const ext = token?.extensions
      if (!ext || ext.isVirtual) return false
      const roots: string[][] | undefined = ext.colorPaletteRoots
      if (!roots) return false
      return roots.some((root) => root.join('.') === paletteKey)
    }
    const colorPaletteKeys = Array.from(tokens.view.colorPalettes.keys()).filter((paletteKey) => {
      if (!colorsCategory) return true
      let hasVisibleMember = false
      let hasMember = false
      for (const [tokenKey, token] of colorsCategory.entries()) {
        if (!tokenBelongsToPalette(token, paletteKey)) continue
        hasMember = true
        const field = token.extensions?.isSemantic ? 'semanticTokens' : 'tokens'
        if (!isHidden(field, `colors.${tokenKey}`)) {
          hasVisibleMember = true
          break
        }
      }
      // If we found no members at all (defensive), keep the palette.
      return hasMember ? hasVisibleMember : true
    })
    if (colorPaletteKeys.length) {
      set.add(`export type ColorPalette = ${unionType(colorPaletteKeys)}`)
    }

    for (const [key, value] of tokens.view.categoryMap.entries()) {
      const filteredKeys: string[] = []
      for (const [tokenKey, token] of value.entries()) {
        const field = token.extensions?.isSemantic ? 'semanticTokens' : 'tokens'
        if (isHidden(field, `${key}.${tokenKey}`)) continue
        filteredKeys.push(tokenKey)
      }
      if (filteredKeys.length === 0) continue

      const typeName = capitalize(pluralize.singular(key))
      const categoryName = `${typeName}Token`
      set.add(`export type ${categoryName} = ${unionType(filteredKeys)}`)
      tokenSet.add(`${key}.$\{${categoryName}}`)
      result.add(`\t\t${key}: ${categoryName}`)
    }
  }

  result.add('} & { [token: string]: never }')

  set.add(Array.from(result).join('\n'))

  set.add(`export type TokenCategory = ${unionType(categories)}`)

  const arr = Array.from(set)
  arr.unshift(
    `export type Token = ${unionType(tokenSet, {
      stringify: (t) => `\`${t}\``,
      fallback: 'string',
    })}`,
  )

  return outdent.string(arr.join('\n\n'))
}
