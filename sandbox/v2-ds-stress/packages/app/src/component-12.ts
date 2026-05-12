import { css, cva } from '../styled-system/css'

export const Component12_box = css({
  bg: 'background.accent.orange.subtler',
  color: 'text.accent.yellow',
  px: 'space.150',
  py: 'space.200',
  borderRadius: 'radius.medium',
  fontSize: 'size.500',
  fontFamily: 'font.body',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.raised',
})

export const Component12_variant = cva({
  base: {
    px: 'space.150',
    py: 'space.200',
    bg: 'background.accent.orange.subtlest',
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
