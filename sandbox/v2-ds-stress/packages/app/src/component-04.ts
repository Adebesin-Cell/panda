import { css, cva } from '../styled-system/css'

export const Component4_box = css({
  bg: 'background.accent.green.subtler',
  color: 'text.accent.teal',
  px: 'space.250',
  py: 'space.300',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.400',
  fontFamily: 'font.heading',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overlay',
})

export const Component4_variant = cva({
  base: {
    px: 'space.250',
    py: 'space.300',
    bg: 'background.accent.green.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
