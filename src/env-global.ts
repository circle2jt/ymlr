const ENVGlobal = {
  get MODE() {
    // flow => display flows in application
    return process.env.MODE
  },
  set MODE(value) {
    process.env.MODE = value
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
  }
}
export default ENVGlobal
