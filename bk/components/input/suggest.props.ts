import { InputProps } from './input.props'
import { SuggestType } from './questions/input-suggest'

export type InputSuggestProps = {
  default?: any
  suggestType?: keyof SuggestType
  choices: Array<{ title: any, value: any }>
} & InputProps
