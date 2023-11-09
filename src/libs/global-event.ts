import { EventEmitter } from 'events'

export const GlobalEvent = new EventEmitter().setMaxListeners(0)
