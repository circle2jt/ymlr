export { FNQueue as default } from './fn-queue'
export const del = () => require('./fn-queue-delete').FNQueueDelete
export const add = () => require('./fn-queue-add').FNQueueAdd
