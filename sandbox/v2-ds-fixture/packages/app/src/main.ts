import { css } from './styled-system/css'
import { panelClass, leafHero } from '@v2-ds-fixture/lib-leaf'

const appOnly = css({
  bg: 'brand', // consumer's magenta override
  color: 'gray.900',
  p: '4',
})

console.log(panelClass, leafHero, appOnly)
