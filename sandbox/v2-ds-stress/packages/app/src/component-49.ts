import { css, cva } from '../styled-system/css'

export const Component49_box = css({
  bg: 'background.accent.gray.subtler',
  color: 'text.accent.lime',
  px: 'space.800',
  py: 'space.0',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.075',
  fontFamily: 'font.heading',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overlay',
})

export const Component49_variant = cva({
  base: {
    px: 'space.800',
    py: 'space.0',
    bg: 'background.accent.gray.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.075' },
      md: { fontSize: 'size.100' },
      lg: { fontSize: 'size.200' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
