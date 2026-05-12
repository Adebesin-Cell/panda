import { css, cva } from '../styled-system/css'

export const Component27_box = css({
  bg: 'background.accent.purple.subtler',
  color: 'text.accent.magenta',
  px: 'space.500',
  py: 'space.600',
  borderRadius: 'radius.medium',
  fontSize: 'size.600',
  fontFamily: 'font.body',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.raised',
})

export const Component27_variant = cva({
  base: {
    px: 'space.500',
    py: 'space.600',
    bg: 'background.accent.purple.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
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
