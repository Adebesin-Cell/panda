import { css, cva } from '../styled-system/css'

export const Component29_box = css({
  bg: 'background.accent.gray.subtler',
  color: 'text.accent.lime',
  px: 'space.800',
  py: 'space.0',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.100',
  fontFamily: 'font.code',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overflow',
})

export const Component29_variant = cva({
  base: {
    px: 'space.800',
    py: 'space.0',
    bg: 'background.accent.gray.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
