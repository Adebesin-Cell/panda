import { css, cva } from '../styled-system/css'

export const Component41_box = css({
  bg: 'background.accent.red.subtler',
  color: 'text.accent.orange',
  px: 'space.100',
  py: 'space.150',
  borderRadius: 'radius.small',
  fontSize: 'size.600',
  fontFamily: 'font.code',
  fontWeight: 'weight.medium',
  shadow: 'elevation.shadow.overflow',
})

export const Component41_variant = cva({
  base: {
    px: 'space.100',
    py: 'space.150',
    bg: 'background.accent.red.subtlest',
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
