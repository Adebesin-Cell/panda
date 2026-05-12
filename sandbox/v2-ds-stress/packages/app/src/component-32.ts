import { css, cva } from '../styled-system/css'

export const Component32_box = css({
  bg: 'background.accent.orange.subtler',
  color: 'text.accent.yellow',
  px: 'space.150',
  py: 'space.200',
  borderRadius: 'radius.medium',
  fontSize: 'size.400',
  fontFamily: 'font.code',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overflow',
})

export const Component32_variant = cva({
  base: {
    px: 'space.150',
    py: 'space.200',
    bg: 'background.accent.orange.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.400' },
      md: { fontSize: 'size.500' },
      lg: { fontSize: 'size.600' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
