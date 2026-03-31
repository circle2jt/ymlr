import { ThrottleManager } from './throttle-manager'

describe('ThrottleManager', () => {
  beforeEach(() => {
    ThrottleManager.Instance.clear()
  })

  it('should be a singleton', () => {
    const instanceA = ThrottleManager.Instance
    const instanceB = ThrottleManager.Instance
    expect(instanceA).toBe(instanceB)
  })

  it('should create new throttle function mapper', () => {
    const fn = ThrottleManager.Instance.new()
    expect(typeof fn).toBe('function')
  })

  it('should ignore calls for non-existent throttle targets', () => {
    expect(() => {
      ThrottleManager.Instance.touch('non-existent')
      ThrottleManager.Instance.cancel('non-existent')
      ThrottleManager.Instance.flush('non-existent')
      ThrottleManager.Instance.remove('non-existent')
    }).not.toThrow()
  })
})
