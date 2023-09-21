import { type AES } from 'src/libs/encrypt/aes'
import { type Base64 } from 'src/libs/encrypt/base64'
import { type MD5 } from 'src/libs/encrypt/md5'

export class UtilityFunctionManager {
  /** |**  $utils.base64
    Base64 encrypt/decrypt a string
    @position bottom
    @tag Utility function
    @example
    ```yaml
      - echo: ${ $utils.base64.encrypt('hello world') }

      - echo: ${ $utils.base64.decrypt('$ENCRYPTED_STRING') }
    ```
  */
  get base64(): Base64 {
    const { Base64 } = require('../libs/encrypt/base64')
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
    textToMs(time: string) {
      const { formatTextToMs } = require('../libs/format')
      return formatTextToMs(time)
    }
  }
}
