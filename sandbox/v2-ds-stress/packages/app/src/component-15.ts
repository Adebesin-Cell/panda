import { css, cva } from '../styled-system/css'

export const Component15_box = css({
  bg: 'background.accent.teal.subtler',
  color: 'text.accent.blue',
  px: 'space.300',
  py: 'space.400',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.100',
  fontFamily: 'font.body',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.raised',
})

export const Component15_variant = cva({
  base: {
    px: 'space.300',
    py: 'space.400',
    bg: 'background.accent.teal.subtlest',
    color: 'text',
    borderRadius: 'radius.xsmall',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.100' },
      md: { fontSize: 'size.200' },
      lg: { fontSize: 'size.300' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
