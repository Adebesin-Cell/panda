import { css, cva } from '../styled-system/css'

export const Component8_box = css({
  bg: 'background.accent.magenta.subtler',
  color: 'text.accent.gray',
  px: 'space.600',
  py: 'space.800',
  borderRadius: 'radius.large',
  fontSize: 'size.100',
  fontFamily: 'font.code',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overflow',
})

export const Component8_variant = cva({
  base: {
    px: 'space.600',
    py: 'space.800',
    bg: 'background.accent.magenta.subtlest',
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
