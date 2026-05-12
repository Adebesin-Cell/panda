import { css, cva } from '../styled-system/css'

export const Component7_box = css({
  bg: 'background.accent.purple.subtler',
  color: 'text.accent.magenta',
  px: 'space.500',
  py: 'space.600',
  borderRadius: 'radius.medium',
  fontSize: 'size.075',
  fontFamily: 'font.heading',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overlay',
})

export const Component7_variant = cva({
  base: {
    px: 'space.500',
    py: 'space.600',
    bg: 'background.accent.purple.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
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
