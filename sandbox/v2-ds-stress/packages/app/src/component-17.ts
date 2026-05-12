import { css, cva } from '../styled-system/css'

export const Component17_box = css({
  bg: 'background.accent.purple.subtler',
  color: 'text.accent.magenta',
  px: 'space.500',
  py: 'space.600',
  borderRadius: 'radius.medium',
  fontSize: 'size.300',
  fontFamily: 'font.code',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overflow',
})

export const Component17_variant = cva({
  base: {
    px: 'space.500',
    py: 'space.600',
    bg: 'background.accent.purple.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.300' },
      md: { fontSize: 'size.400' },
      lg: { fontSize: 'size.500' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
