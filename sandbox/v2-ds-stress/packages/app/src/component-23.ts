import { css, cva } from '../styled-system/css'

export const Component23_box = css({
  bg: 'background.accent.yellow.subtler',
  color: 'text.accent.green',
  px: 'space.200',
  py: 'space.250',
  borderRadius: 'radius.large',
  fontSize: 'size.200',
  fontFamily: 'font.code',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overflow',
})

export const Component23_variant = cva({
  base: {
    px: 'space.200',
    py: 'space.250',
    bg: 'background.accent.yellow.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
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
