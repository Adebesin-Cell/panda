import { css, cva } from '../styled-system/css'

export const Component45_box = css({
  bg: 'background.accent.teal.subtler',
  color: 'text.accent.blue',
  px: 'space.300',
  py: 'space.400',
  borderRadius: 'radius.xsmall',
  fontSize: 'size.300',
  fontFamily: 'font.body',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.raised',
})

export const Component45_variant = cva({
  base: {
    px: 'space.300',
    py: 'space.400',
    bg: 'background.accent.teal.subtlest',
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
