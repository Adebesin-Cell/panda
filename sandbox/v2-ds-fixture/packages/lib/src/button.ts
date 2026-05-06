import { css } from '@v2-ds-fixture/styled-system/css'
import { button } from '@v2-ds-fixture/styled-system/recipes'

export const buttonStyles = (visual: 'solid' | 'outline' = 'solid') => button({ visual })

export const heroStyles = css({
  bg: 'brand',
  color: 'white',
  px: '6',
  py: '4',
  animation: 'acmeFade 0.3s ease-in-out',
})
