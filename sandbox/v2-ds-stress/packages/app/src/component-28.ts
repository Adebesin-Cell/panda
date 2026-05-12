import { css, cva } from '../styled-system/css'

export const Component28_box = css({
  bg: 'background.accent.magenta.subtler',
  color: 'text.accent.gray',
  px: 'space.600',
  py: 'space.800',
  borderRadius: 'radius.large',
  fontSize: 'size.075',
  fontFamily: 'font.heading',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overlay',
})

export const Component28_variant = cva({
  base: {
    px: 'space.600',
    py: 'space.800',
    bg: 'background.accent.magenta.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
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
