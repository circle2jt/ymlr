const ENVGlobal = {
  _prod: undefined as boolean | undefined,
  get IS_PROD() {
    return this._prod ?? (this._prod = (process.env.NODE_ENV === 'production'))
  },
  get MODE() {
    // flow => display flows in application
    return process.env.MODE
  },
  set MODE(value) {
    process.env.MODE = value
  },

  get AUTO_INSTALL() {
    // auto-install => auto install lack package in the running
    return process.env.AUTO_INSTALL
  },
  set AUTO_INSTALL(value) {
    process.env.AUTO_INSTALL = value ? '1' : undefined
  },

  get SAND_SCENE_PASSWORD() {
    return process.env.SAND_SCENE_PASSWORD || '8af44bb050ddcd669e902147f44c1434'
  },
  set SAND_SCENE_PASSWORD(value) {
    process.env.SAND_SCENE_PASSWORD = value
  },

  get DEBUG_GROUP_RESULT() {
    // 0 || 1  -> Used for unit test
    return process.env.DEBUG_GROUP_RESULT
  },
  set DEBUG_GROUP_RESULT(value) {
    process.env.DEBUG_GROUP_RESULT = value
  },

  get DEBUG() {
    return process.env.DEBUG
  },
  set DEBUG(value) {
    process.env.DEBUG = value
  },

  get DEBUG_SECRET() {
    return process.env.DEBUG_SECRET
  },
  set DEBUG_SECRET(value) {
    process.env.DEBUG_SECRET = value
  },

  get DEBUG_CONTEXT_FILTER() {
    return process.env.DEBUG_CONTEXT_FILTER
  },
  set DEBUG_CONTEXT_FILTER(value) {
    process.env.DEBUG_CONTEXT_FILTER = value
  },

  get PACKAGE_MANAGERS() {
    return process.env.PACKAGE_MANAGERS || 'yarn,npm,pnpm,bun'
  },
  set PACKAGE_MANAGERS(value) {
    process.env.PACKAGE_MANAGERS = value
  },

  _fnQueueSkipError: false,
  get FN_QUEUE_SKIP_ERROR() {
    return this._fnQueueSkipError ?? (this._fnQueueSkipError = toBool(process.env.FN_QUEUE_SKIP_ERROR))
  },
  _fnDebounceSkipError: false,
  get FN_DEBOUNCE_SKIP_ERROR() {
    return this._fnDebounceSkipError ?? (this._fnDebounceSkipError = toBool(process.env.FN_DEBOUNCE_SKIP_ERROR))
  },
  _fnThrottleSkipError: false,
  get FN_THROTTLE_SKIP_ERROR() {
    return this._fnThrottleSkipError ?? (this._fnThrottleSkipError = toBool(process.env.FN_THROTTLE_SKIP_ERROR))
  },
  _fnSingletonSkipError: false,
  get FN_SINGLETON_SKIP_ERROR() {
    return this._fnSingletonSkipError ?? (this._fnSingletonSkipError = toBool(process.env.FN_SINGLETON_SKIP_ERROR))
  },
}
export default ENVGlobal

function toBool(vl: string | undefined): boolean {
  return vl === '1' || vl === 'true' || vl === 'yes'
}
