import { css, cva } from '../styled-system/css'

export const Component48_box = css({
  bg: 'background.accent.magenta.subtler',
  color: 'text.accent.gray',
  px: 'space.600',
  py: 'space.800',
  borderRadius: 'radius.large',
  fontSize: 'size.600',
  fontFamily: 'font.body',
  fontWeight: 'weight.regular',
  shadow: 'elevation.shadow.raised',
})

export const Component48_variant = cva({
  base: {
    px: 'space.600',
    py: 'space.800',
    bg: 'background.accent.magenta.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
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
