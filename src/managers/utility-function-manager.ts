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
      # Format file name
      - echo: ${ $utils.format.fileName('a@(*&#.jpg') }

      - echo: ${ $utils.format.number(1000000) }
    ```
  */
  format = {
    fileName(fileName: string) {
      const { formatFileName } = require('../libs/format')
      return formatFileName(fileName)
    },
    number(num: number, opts?: Intl.NumberFormatOptions) {
      const { formatNumber } = require('../libs/format')
      return formatNumber(num, opts)
    }
  }
}
