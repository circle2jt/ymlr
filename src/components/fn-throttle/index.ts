export { FNThrottle as default } from './fn-throttle'
export const cancel = () => require('./fn-throttle-cancel').FNThrottleCancel
export const flush = () => require('./fn-throttle-flush').FNThrottleFlush
export const del = () => require('./fn-throttle-delete').FNThrottleDelete
