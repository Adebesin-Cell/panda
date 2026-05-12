import { css, cva } from '../styled-system/css'

export const Component26_box = css({
  bg: 'background.accent.blue.subtler',
  color: 'text.accent.purple',
  px: 'space.400',
  py: 'space.500',
  borderRadius: 'radius.small',
  fontSize: 'size.500',
  fontFamily: 'font.code',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overflow',
})

export const Component26_variant = cva({
  base: {
    px: 'space.400',
    py: 'space.500',
    bg: 'background.accent.blue.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
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
