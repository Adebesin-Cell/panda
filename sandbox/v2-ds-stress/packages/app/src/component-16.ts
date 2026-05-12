import { css, cva } from '../styled-system/css'

export const Component16_box = css({
  bg: 'background.accent.blue.subtler',
  color: 'text.accent.purple',
  px: 'space.400',
  py: 'space.500',
  borderRadius: 'radius.small',
  fontSize: 'size.200',
  fontFamily: 'font.heading',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.overlay',
})

export const Component16_variant = cva({
  base: {
    px: 'space.400',
    py: 'space.500',
    bg: 'background.accent.blue.subtlest',
    color: 'text',
    borderRadius: 'radius.small',
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
