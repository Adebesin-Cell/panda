import { css, cva } from '../styled-system/css'

export const Component34_box = css({
  bg: 'background.accent.green.subtler',
  color: 'text.accent.teal',
  px: 'space.250',
  py: 'space.300',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.600',
  fontFamily: 'font.heading',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overlay',
})

export const Component34_variant = cva({
  base: {
    px: 'space.250',
    py: 'space.300',
    bg: 'background.accent.green.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.600' },
      md: { fontSize: 'size.075' },
      lg: { fontSize: 'size.100' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
