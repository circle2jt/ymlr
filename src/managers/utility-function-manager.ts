import type EventEmitter from 'events'
import { type DumpOptions } from 'js-yaml'
import { type Base64 } from 'src/libs/encode/base64'
import { type Url } from 'src/libs/encode/url'
import { type AES } from 'src/libs/encrypt/aes'
import { type MD5 } from 'src/libs/encrypt/md5'
import { GlobalEvent } from 'src/libs/global-event'

export class UtilityFunctionManager {
  static #Instance: UtilityFunctionManager
  static get Instance() {
    if (!this.#Instance) {
      this.#Instance = new UtilityFunctionManager()
    }
    return this.#Instance
  }

  /** |**  $utils.globalEvent
    Reference global event in application
    @position bottom
    @tag Utility function
    @example
    ```yaml
      - js: |
          $utils.globalEvent.on('say', (name) => {
            this.logger.info('Hello', name)
          })

      - js: |
          $utils.globalEvent.emit('say', 'Thanh 01')
    ```
  */
  get globalEvent(): EventEmitter {
    return GlobalEvent
  }

  /** |**  $utils.url
    URL encode/decode a string
    @position bottom
    @tag Utility function
    @example
    ```yaml
      - echo: ${ $utils.url.encode('hello world') }

      - echo: ${ $utils.url.decode('$ENCODED_STRING') }
    ```
  */
  get url(): Url {
    const { Url } = require('../libs/encode/url')
    return new Url()
  }

  /** |**  $utils.base64
    Base64 encrypt/decrypt a string
    @position bottom
    @tag Utility function
    @example
    ```yaml
      - echo: ${ $utils.base64.encode('hello world') }

      - echo: ${ $utils.base64.decrypt('$ENCODED_STRING') }
    ```
  */
  get base64(): Base64 {
    const { Base64 } = require('../libs/encode/base64')
    return new Base64()
  }

  /** |**  $utils.md5
    Encrypt a string to md5
    @position bottom
    @tag Utility function
    @example
    ```yaml
      - echo: ${ $utils.md5.encrypt('hello world') }
    ```
  */
  get md5(): MD5 {
    const { MD5 } = require('../libs/encrypt/md5')
    return new MD5()
  }

  /** |**  $utils.base64
    AES encrypt/decrypt a string
    @position bottom
    @tag Utility function
    @example
    ```yaml
      - echo: ${ $utils.aes.encrypt('hello world') }

      - echo: ${ $utils.aes.decrypt('$ENCRYPTED_STRING') }
    ```
  */
  get aes(): AES {
    const { AES } = require('../libs/encrypt/aes')
    return new AES()
  }

  /** |**  $utils.format
    Formater
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - echo: ${ $utils.format.fileName('a@(*&#à.jpg', ' ') }                             # => a a.jpg

    - echo: ${ $utils.format.number(1000000) }                                          # => 1,000,000

    - echo: ${ $utils.format.number(1000000) }                                          # => 1,000,000

    - echo: ${ $utils.format.fixLengthNumber(1, 2) }                                    # => 001
    - echo: ${ $utils.format.fixLengthNumber(10, 2) }                                   # => 010

    - echo: ${ $utils.format.formatTextToMs('1d 1h 1m 1s 100') }                        # => 90061100

    - echo: ${ $utils.format.formatTextToMs(new Date(), 'DD/MM/YYYY hh:mm:ss.ms') }     # => 01/12/2023 23:59:59.0

    - echo: ${ $utils.format.yaml({name: 'yaml title'})}                                # => name: yaml title
    ```
  */
  format = {
    date(date: Date, format: string) {
      const { formatDate } = require('../libs/format')
      return formatDate(date, format)
    },
    fileName(fileName: string) {
      const { formatFileName } = require('../libs/format')
      return formatFileName(fileName)
    },
    fixLengthNumber(n: number, length?: number) {
      const { formatFixLengthNumber } = require('../libs/format')
      return formatFixLengthNumber(n, length)
    },
    number(num: number, opts?: Intl.NumberFormatOptions) {
      const { formatNumber } = require('../libs/format')
      return formatNumber(num, opts)
    },
    duration(ms: number) {
      const { formatDuration } = require('../libs/format')
      return formatDuration(ms)
    },
    textToMs(time: string | number) {
      const { formatTextToMs } = require('../libs/format')
      return formatTextToMs(time)
    },
    yaml(obj: any, opts: DumpOptions) {
      if (obj === null || obj === undefined) {
        return obj
      }
      const { dump } = require('js-yaml')
      return dump(obj, opts)
    }
  }

  /** |**  $utils.parse
    Parser
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - echo: ${ $utils.parse.yaml('title: "yaml title"') }       # => { "title": "yaml title" }
  */
  parse = {
    yaml(content?: string) {
      if (!content) return undefined
      const { load } = require('js-yaml')
      return load(content)
    }
  }

  get debounceManager() {
    const { DebounceManager } = require('./debounce-manager')
    return DebounceManager.Instance
  }

  get throttleManager() {
    const { ThrottleManager } = require('./throttle-manager')
    return ThrottleManager.Instance
  }
}
