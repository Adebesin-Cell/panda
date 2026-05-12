import { css, cva } from '../styled-system/css'

export const Component18_box = css({
  bg: 'background.accent.magenta.subtler',
  color: 'text.accent.gray',
  px: 'space.600',
  py: 'space.800',
  borderRadius: 'radius.large',
  fontSize: 'size.400',
  fontFamily: 'font.body',
  fontWeight: 'weight.semibold',
  shadow: 'elevation.shadow.raised',
})

export const Component18_variant = cva({
  base: {
    px: 'space.600',
    py: 'space.800',
    bg: 'background.accent.magenta.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
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
