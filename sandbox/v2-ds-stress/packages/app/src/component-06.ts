import { css, cva } from '../styled-system/css'

export const Component6_box = css({
  bg: 'background.accent.blue.subtler',
  color: 'text.accent.purple',
  px: 'space.400',
  py: 'space.500',
  borderRadius: 'radius.small',
  fontSize: 'size.600',
  fontFamily: 'font.body',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.raised',
})

export const Component6_variant = cva({
  base: {
    px: 'space.400',
    py: 'space.500',
    bg: 'background.accent.blue.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.600' },
      md: { fontSize: 'size.075' },
      lg: { fontSize: 'size.100' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
