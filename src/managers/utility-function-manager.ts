import chalk from 'chalk'
import type EventEmitter from 'events'
import { dump, load, type DumpOptions } from 'js-yaml'
import { Base64 } from 'src/libs/encode/base64'
import { Url } from 'src/libs/encode/url'
import { AES } from 'src/libs/encrypt/aes'
import { MD5 } from 'src/libs/encrypt/md5'
import { formatDate, formatDuration, formatFileName, formatFixLengthNumber, formatNumber, formatTextToMs } from 'src/libs/format'
import { GlobalEvent } from 'src/libs/global-event'
import { sleep, toDate } from 'src/libs/time'
import { DebounceManager } from './debounce-manager'
import { ThrottleManager } from './throttle-manager'

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
      return formatDate(date, format)
    },
    fileName(fileName: string) {
      return formatFileName(fileName)
    },
    fixLengthNumber(n: number, length?: number) {
      return formatFixLengthNumber(n, length)
    },
    number(num: number, opts?: Intl.NumberFormatOptions) {
      return formatNumber(num, opts)
    },
    duration(ms: number) {
      return formatDuration(ms)
    },
    textToMs(time: string | number) {
      return formatTextToMs(time)
    },
    yaml(obj: any, opts: DumpOptions) {
      if (obj === null || obj === undefined) {
        return obj
      }
      return dump(obj, opts)
    }
  }

  /** |**  $utils.parse
    Parser
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - name: parse string to yaml content text
      echo: ${ $utils.parse.yaml('title: "yaml title"') }       # => { "title": "yaml title" }

    - name: parse string to Date object
      echo: ${ $utils.parse.date('2024/11/06 23:11:00.000', 'YYYY/MM/DD hh:mm:ss.ms') }
  */
  parse = {
    yaml(content?: string) {
      if (!content) return undefined
      return load(content)
    },
    date(dateString: string, format: string) {
      if (!dateString) return undefined
      return toDate(dateString, format)
    }
  }

  /** |**  $utils.sleep
    Sleep before do the next
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - js: |
        this.logger.info('Sleep 5s')
        await $utils.sleep('5s')
        this.logger.info('Do it')
  */
  sleep = sleep

  /** |**  $utils.debounceManager
    Return using map debounce function via fn-debounce
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - fn-debounce:
        name: testDebounce
        wait: 5s
      runs:
        - echo: Hello
    - js: |
        const count = $utils.debounceManager.size()
        const hasDebounce = $utils.debounceManager.has('testDebounce')
        $utils.debounceManager.get('testDebounce').flush()
  */
  get debounceManager() {
    return DebounceManager.Instance
  }

  /** |**  $utils.throttleManager
    Return using map throttle function via fn-throttle
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - fn-throttle:
        name: testThrottle
        wait: 5s
      runs:
        - echo: Hello
    - js: |
        const count = $utils.throttleManager.size()
        const hasThrottle = $utils.throttleManager.has('testThrottle')
        $utils.throttleManager.get('testThrottle').flush()
  */
  get throttleManager() {
    return ThrottleManager.Instance
  }

  /** |**  $utils.styles
    Return [chalk](https://www.npmjs.com/package/chalk) which decorate text style (color, italic, bold, bgColor....)
    @position bottom
    @tag Utility function
    @example
    ```yaml
    - js: |
        this.logger.debug($utils.styles.red('Red text'))
        this.logger.debug($utils.styles.blue.italic('Blue and italic text'))
  */
  get styles() {
    return chalk
  }
}
