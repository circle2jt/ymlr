export default () => require('./fn-throttle').FNThrottle
export const cancel = () => require('./fn-throttle-cancel').FNThrottleCancel
export const flush = () => require('./fn-throttle-flush').FNThrottleFlush
export const del = () => require('./fn-throttle-delete').FNThrottleDelete
export const touch = () => require('./fn-throttle-touch').FNThrottleTouch
