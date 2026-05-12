import { css, cva } from '../styled-system/css'

export const Component37_box = css({
  bg: 'background.accent.purple.subtler',
  color: 'text.accent.magenta',
  px: 'space.500',
  py: 'space.600',
  borderRadius: 'radius.medium',
  fontSize: 'size.200',
  fontFamily: 'font.heading',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overlay',
})

export const Component37_variant = cva({
  base: {
    px: 'space.500',
    py: 'space.600',
    bg: 'background.accent.purple.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
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
