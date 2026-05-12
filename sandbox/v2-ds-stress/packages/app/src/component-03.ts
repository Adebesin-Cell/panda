import { css, cva } from '../styled-system/css'

export const Component3_box = css({
  bg: 'background.accent.yellow.subtler',
  color: 'text.accent.green',
  px: 'space.200',
  py: 'space.250',
  borderRadius: 'radius.large',
  fontSize: 'size.300',
  fontFamily: 'font.body',
  fontWeight: 'weight.bold',
  shadow: 'elevation.shadow.raised',
})

export const Component3_variant = cva({
  base: {
    px: 'space.200',
    py: 'space.250',
    bg: 'background.accent.yellow.subtlest',
    color: 'text',
    borderRadius: 'radius.large',
  },
  variants: {
    size: {
      sm: { fontSize: 'size.300' },
      md: { fontSize: 'size.400' },
      lg: { fontSize: 'size.500' },
    },
    tone: {
      neutral: { bg: 'background.neutral.subtle' },
      brand: { bg: 'background.brand.bold', color: 'text.inverse' },
    },
  },
})
