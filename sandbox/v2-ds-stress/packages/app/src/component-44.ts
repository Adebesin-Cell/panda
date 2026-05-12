import { css, cva } from '../styled-system/css'

export const Component44_box = css({
  bg: 'background.accent.green.subtler',
  color: 'text.accent.teal',
  px: 'space.250',
  py: 'space.300',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.200',
  fontFamily: 'font.code',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overflow',
})

export const Component44_variant = cva({
  base: {
    px: 'space.250',
    py: 'space.300',
    bg: 'background.accent.green.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
