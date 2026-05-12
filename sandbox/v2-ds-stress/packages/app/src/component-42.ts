import { css, cva } from '../styled-system/css'

export const Component42_box = css({
  bg: 'background.accent.orange.subtler',
  color: 'text.accent.yellow',
  px: 'space.150',
  py: 'space.200',
  borderRadius: 'radius.medium',
  fontSize: 'size.075',
  fontFamily: 'font.body',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.raised',
})

export const Component42_variant = cva({
  base: {
    px: 'space.150',
    py: 'space.200',
    bg: 'background.accent.orange.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
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
