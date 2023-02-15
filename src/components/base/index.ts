import { ElementShadow } from '../element-shadow'

export default class Base extends ElementShadow {
  constructor(public props: any) {
    super()
  }

  async exec() {
    return this.props
  }
}
