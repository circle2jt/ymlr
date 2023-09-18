import { type InputProps } from './input.props'
import { type SuggestType } from './questions/input-suggest'

export type InputSuggestProps = {
  default?: any
  suggestType?: keyof SuggestType
  choices: Array<{ title: any, value: any }>
} & InputProps
