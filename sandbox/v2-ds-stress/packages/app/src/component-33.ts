import { css, cva } from '../styled-system/css'

export const Component33_box = css({
  bg: 'background.accent.yellow.subtler',
  color: 'text.accent.green',
  px: 'space.200',
  py: 'space.250',
  borderRadius: 'radius.large',
  fontSize: 'size.500',
  fontFamily: 'font.body',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.raised',
})

export const Component33_variant = cva({
  base: {
    px: 'space.200',
    py: 'space.250',
    bg: 'background.accent.yellow.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.500' },
      md: { fontSize: 'size.600' },
      lg: { fontSize: 'size.075' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
