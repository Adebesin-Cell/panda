import { css, cva } from '../styled-system/css'

export const Component25_box = css({
  bg: 'background.accent.teal.subtler',
  color: 'text.accent.blue',
  px: 'space.300',
  py: 'space.400',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.400',
  fontFamily: 'font.heading',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overlay',
})

export const Component25_variant = cva({
  base: {
    px: 'space.300',
    py: 'space.400',
    bg: 'background.accent.teal.subtlest',
    color: 'text',
    borderRadius: 'radius.xsmall',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.400' },
      md: { fontSize: 'size.500' },
      lg: { fontSize: 'size.600' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
