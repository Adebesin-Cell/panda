import { css, cva } from '../styled-system/css'

export const Component13_box = css({
  bg: 'background.accent.yellow.subtler',
  color: 'text.accent.green',
  px: 'space.200',
  py: 'space.250',
  borderRadius: 'radius.large',
  fontSize: 'size.600',
  fontFamily: 'font.heading',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overlay',
})

export const Component13_variant = cva({
  base: {
    px: 'space.200',
    py: 'space.250',
    bg: 'background.accent.yellow.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
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
