import { InputProps } from './input.props'

export type InputSelectProps = {
  default?: any
  choices: Array<{ title: any, value: any }>
} & InputProps
