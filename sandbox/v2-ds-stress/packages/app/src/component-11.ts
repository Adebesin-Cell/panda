import { css, cva } from '../styled-system/css'

export const Component11_box = css({
  bg: 'background.accent.red.subtler',
  color: 'text.accent.orange',
  px: 'space.100',
  py: 'space.150',
  borderRadius: 'radius.small',
  fontSize: 'size.400',
  fontFamily: 'font.code',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overflow',
})

export const Component11_variant = cva({
  base: {
    px: 'space.100',
    py: 'space.150',
    bg: 'background.accent.red.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
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
