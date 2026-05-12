import { css, cva } from '../styled-system/css'

export const Component24_box = css({
  bg: 'background.accent.green.subtler',
  color: 'text.accent.teal',
  px: 'space.250',
  py: 'space.300',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.300',
  fontFamily: 'font.body',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.raised',
})

export const Component24_variant = cva({
  base: {
    px: 'space.250',
    py: 'space.300',
    bg: 'background.accent.green.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
