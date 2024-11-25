import assert from 'assert'
import { Group } from './group'
import { type GroupItemProps, type GroupProps } from './group.props'

export class InnerGroup<GP extends GroupProps, GIP extends GroupItemProps> extends Group<GP, GIP> {
  _parent!: Element

  constructor(props?: GP & { _parent: Element }) {
    assert(props?._parent)
    super(props)
    this._parent = props._parent
  }
}
