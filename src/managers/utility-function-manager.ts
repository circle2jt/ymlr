import { AES } from 'src/libs/encrypt/aes'
import { Base64 } from 'src/libs/encrypt/base64'
import { MD5 } from 'src/libs/encrypt/md5'

export class UtilityFunctionManager {
  get base64(): Base64 {
    const { Base64 } = require('../libs/encrypt/base64')
    return new Base64()
  }

  get md5(): MD5 {
    const { MD5 } = require('../libs/encrypt/md5')
    return new MD5()
  }

  get aes(): AES {
    const { AES } = require('../libs/encrypt/aes')
    return new AES()
  }

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
