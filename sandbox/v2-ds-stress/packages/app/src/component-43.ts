import { css, cva } from '../styled-system/css'

export const Component43_box = css({
  bg: 'background.accent.yellow.subtler',
  color: 'text.accent.green',
  px: 'space.200',
  py: 'space.250',
  borderRadius: 'radius.large',
  fontSize: 'size.100',
  fontFamily: 'font.heading',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overlay',
})

export const Component43_variant = cva({
  base: {
    px: 'space.200',
    py: 'space.250',
    bg: 'background.accent.yellow.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
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
