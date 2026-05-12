import { css, cva } from '../styled-system/css'

export const Component20_box = css({
  bg: 'background.accent.lime.subtler',
  color: 'text.accent.red',
  px: 'space.0',
  py: 'space.100',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.600',
  fontFamily: 'font.code',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overflow',
})

export const Component20_variant = cva({
  base: {
    px: 'space.0',
    py: 'space.100',
    bg: 'background.accent.lime.subtlest',
    color: 'text',
    borderRadius: 'radius.xsmall',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.600' },
      md: { fontSize: 'size.075' },
      lg: { fontSize: 'size.100' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
