import { css, cva } from '../styled-system/css'

export const Component10_box = css({
  bg: 'background.accent.lime.subtler',
  color: 'text.accent.red',
  px: 'space.0',
  py: 'space.100',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.300',
  fontFamily: 'font.heading',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overlay',
})

export const Component10_variant = cva({
  base: {
    px: 'space.0',
    py: 'space.100',
    bg: 'background.accent.lime.subtlest',
    color: 'text',
    borderRadius: 'radius.xsmall',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.300' },
      md: { fontSize: 'size.400' },
      lg: { fontSize: 'size.500' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
