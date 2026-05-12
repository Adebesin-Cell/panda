import { css, cva } from '../styled-system/css'

export const Component39_box = css({
  bg: 'background.accent.gray.subtler',
  color: 'text.accent.lime',
  px: 'space.800',
  py: 'space.0',
  borderRadius: 'radius.xlarge',
  fontSize: 'size.400',
  fontFamily: 'font.body',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.raised',
})

export const Component39_variant = cva({
  base: {
    px: 'space.800',
    py: 'space.0',
    bg: 'background.accent.gray.subtlest',
    color: 'text',
    borderRadius: 'radius.xlarge',
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
