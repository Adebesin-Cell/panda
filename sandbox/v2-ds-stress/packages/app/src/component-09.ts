import { css, cva } from '../styled-system/css'

export const Component9_box = css({
  bg: 'background.accent.gray.subtler',
  color: 'text.accent.lime',
  px: 'space.800',
  py: 'space.0',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.200',
  fontFamily: 'font.body',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.raised',
})

export const Component9_variant = cva({
  base: {
    px: 'space.800',
    py: 'space.0',
    bg: 'background.accent.gray.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
