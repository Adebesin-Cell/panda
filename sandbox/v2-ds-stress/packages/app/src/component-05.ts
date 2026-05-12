import { css, cva } from '../styled-system/css'

export const Component5_box = css({
  bg: 'background.accent.teal.subtler',
  color: 'text.accent.blue',
  px: 'space.300',
  py: 'space.400',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.500',
  fontFamily: 'font.code',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overflow',
})

export const Component5_variant = cva({
  base: {
    px: 'space.300',
    py: 'space.400',
    bg: 'background.accent.teal.subtlest',
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
