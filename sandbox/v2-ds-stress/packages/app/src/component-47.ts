import { css, cva } from '../styled-system/css'

export const Component47_box = css({
  bg: 'background.accent.purple.subtler',
  color: 'text.accent.magenta',
  px: 'space.500',
  py: 'space.600',
  borderRadius: 'radius.medium',
  fontSize: 'size.500',
  fontFamily: 'font.code',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overflow',
})

export const Component47_variant = cva({
  base: {
    px: 'space.500',
    py: 'space.600',
    bg: 'background.accent.purple.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
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
