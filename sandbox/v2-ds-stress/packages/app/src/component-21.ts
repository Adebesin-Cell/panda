import { css, cva } from '../styled-system/css'

export const Component21_box = css({
  bg: 'background.accent.red.subtler',
  color: 'text.accent.orange',
  px: 'space.100',
  py: 'space.150',
  borderRadius: 'radius.small',
  fontSize: 'size.075',
  fontFamily: 'font.body',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.raised',
})

export const Component21_variant = cva({
  base: {
    px: 'space.100',
    py: 'space.150',
    bg: 'background.accent.red.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
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
