import { css, cva } from '../styled-system/css'

export const Component14_box = css({
  bg: 'background.accent.green.subtler',
  color: 'text.accent.teal',
  px: 'space.250',
  py: 'space.300',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.075',
  fontFamily: 'font.code',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overflow',
})

export const Component14_variant = cva({
  base: {
    px: 'space.250',
    py: 'space.300',
    bg: 'background.accent.green.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.075' },
      md: { fontSize: 'size.100' },
      lg: { fontSize: 'size.200' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
