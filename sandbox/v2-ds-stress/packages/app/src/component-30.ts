import { css, cva } from '../styled-system/css'

export const Component30_box = css({
  bg: 'background.accent.lime.subtler',
  color: 'text.accent.red',
  px: 'space.0',
  py: 'space.100',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.200',
  fontFamily: 'font.body',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.raised',
})

export const Component30_variant = cva({
  base: {
    px: 'space.0',
    py: 'space.100',
    bg: 'background.accent.lime.subtlest',
    color: 'text',
    borderRadius: 'radius.xsmall',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.200' },
      md: { fontSize: 'size.300' },
      lg: { fontSize: 'size.400' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
