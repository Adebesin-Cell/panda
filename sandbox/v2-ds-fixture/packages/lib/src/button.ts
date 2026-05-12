import { css } from '../styled-system/css'
import { button } from '../styled-system/recipes'

export const buttonStyles = (visual: 'solid' | 'outline' = 'solid') => button({ visual })

export const heroStyles = css({
  bg: 'brand',
  color: 'white',
  px: '6',
  py: '4',
  animation: 'acmeFade 0.3s ease-in-out',
})
