import { css, cva } from '../styled-system/css'

export const Component46_box = css({
  bg: 'background.accent.blue.subtler',
  color: 'text.accent.purple',
  px: 'space.400',
  py: 'space.500',
  borderRadius: 'radius.small',
  fontSize: 'size.400',
  fontFamily: 'font.heading',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.overlay',
})

export const Component46_variant = cva({
  base: {
    px: 'space.400',
    py: 'space.500',
    bg: 'background.accent.blue.subtlest',
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
