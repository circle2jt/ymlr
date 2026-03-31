import { DebounceManager } from './debounce-manager'

describe('DebounceManager', () => {
  beforeEach(() => {
    DebounceManager.Instance.clear()
  })

  it('should be a singleton', () => {
    const instanceA = DebounceManager.Instance
    const instanceB = DebounceManager.Instance
    expect(instanceA).toBe(instanceB)
  })

  it('should create new debounce function mapper', () => {
    const fn = DebounceManager.Instance.new()
    expect(typeof fn).toBe('function')
  })

  it('should ignore calls for non-existent debounce targets', () => {
    expect(() => {
      DebounceManager.Instance.touch('non-existent')
      DebounceManager.Instance.cancel('non-existent')
      DebounceManager.Instance.flush('non-existent')
      DebounceManager.Instance.remove('non-existent')
    }).not.toThrow()
  })
})
