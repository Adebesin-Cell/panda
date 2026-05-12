import { css, cva } from '../styled-system/css'

export const Component31_box = css({
  bg: 'background.accent.red.subtler',
  color: 'text.accent.orange',
  px: 'space.100',
  py: 'space.150',
  borderRadius: 'radius.small',
  fontSize: 'size.300',
  fontFamily: 'font.heading',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overlay',
})

export const Component31_variant = cva({
  base: {
    px: 'space.100',
    py: 'space.150',
    bg: 'background.accent.red.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
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
