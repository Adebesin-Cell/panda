import { css, cva } from '../styled-system/css'

export const Component40_box = css({
  bg: 'background.accent.lime.subtler',
  color: 'text.accent.red',
  px: 'space.0',
  py: 'space.100',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.500',
  fontFamily: 'font.heading',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overlay',
})

export const Component40_variant = cva({
  base: {
    px: 'space.0',
    py: 'space.100',
    bg: 'background.accent.lime.subtlest',
    color: 'text',
    borderRadius: 'radius.xsmall',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.500' },
      md: { fontSize: 'size.600' },
      lg: { fontSize: 'size.075' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
