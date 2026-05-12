import { css, cva } from '../styled-system/css'

export const Component22_box = css({
  bg: 'background.accent.orange.subtler',
  color: 'text.accent.yellow',
  px: 'space.150',
  py: 'space.200',
  borderRadius: 'radius.medium',
  fontSize: 'size.100',
  fontFamily: 'font.heading',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overlay',
})

export const Component22_variant = cva({
  base: {
    px: 'space.150',
    py: 'space.200',
    bg: 'background.accent.orange.subtlest',
    color: 'text',
    borderRadius: 'radius.medium',
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
