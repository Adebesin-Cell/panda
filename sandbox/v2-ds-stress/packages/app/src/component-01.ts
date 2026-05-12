import { css, cva } from '../styled-system/css'

export const Component1_box = css({
  bg: 'background.accent.red.subtler',
  color: 'text.accent.orange',
  px: 'space.100',
  py: 'space.150',
  borderRadius: 'radius.small',
  fontSize: 'size.100',
  fontFamily: 'font.heading',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overlay',
})

export const Component1_variant = cva({
  base: {
    px: 'space.100',
    py: 'space.150',
    bg: 'background.accent.red.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
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
