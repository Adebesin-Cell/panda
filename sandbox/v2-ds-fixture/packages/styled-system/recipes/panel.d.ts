/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PanelVariant {
  
}

type PanelVariantMap = {
  [key in keyof PanelVariant]: Array<PanelVariant[key]>
}



export type PanelVariantProps = {
  [key in keyof PanelVariant]?: ConditionalValue<PanelVariant[key]> | undefined
}

export interface PanelRecipe {
  
  __type: PanelVariantProps
  (props?: PanelVariantProps): string
  raw: (props?: PanelVariantProps) => PanelVariantProps
  variantMap: PanelVariantMap
  variantKeys: Array<keyof PanelVariant>
  splitVariantProps<Props extends PanelVariantProps>(props: Props): [PanelVariantProps, Pretty<DistributiveOmit<Props, keyof PanelVariantProps>>]
  getVariantProps: (props?: PanelVariantProps) => PanelVariantProps
}


export declare const panel: PanelRecipe