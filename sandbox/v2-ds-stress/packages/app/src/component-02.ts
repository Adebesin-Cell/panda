import { css, cva } from '../styled-system/css'

export const Component2_box = css({
  bg: 'background.accent.orange.subtler',
  color: 'text.accent.yellow',
  px: 'space.150',
  py: 'space.200',
  borderRadius: 'radius.medium',
  fontSize: 'size.200',
  fontFamily: 'font.code',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overflow',
})

export const Component2_variant = cva({
  base: {
    px: 'space.150',
    py: 'space.200',
    bg: 'background.accent.orange.subtlest',
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
