import EventEmitter from 'events'

export const GlobalEvent = new EventEmitter({ captureRejections: false })
GlobalEvent.setMaxListeners(0)
