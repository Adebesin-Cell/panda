import { css, cva } from '../styled-system/css'

export const Component19_box = css({
  bg: 'background.accent.gray.subtler',
  color: 'text.accent.lime',
  px: 'space.800',
  py: 'space.0',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.500',
  fontFamily: 'font.heading',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.overlay',
})

export const Component19_variant = cva({
  base: {
    px: 'space.800',
    py: 'space.0',
    bg: 'background.accent.gray.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
