/*
 * INTER-Mediator
 * Copyright (c) INTER-Mediator Directive Committee (http://inter-mediator.org)
 * This project started at the end of 2009 by Masayuki Nii msyk@msyk.net.
 *
 * INTER-Mediator is supplied under MIT License.
 * Please see the full license for details:
 * https://github.com/INTER-Mediator/INTER-Mediator/blob/master/dist-docs/License.txt
 */

// JSHint support
/* global INTERMediator, INTERMediatorLocale, IMLibMouseEventDispatch, IMLibUI, IMLibKeyDownEventDispatch,
 IMLibChangeEventDispatch, INTERMediatorLib, INTERMediator_DBAdapter, IMLibQueue, IMLibCalc, IMLibPageNavigation,
 IMLibEventResponder, IMLibElement, Parser, IMLib */

const IMLibFormat = {

  isFollowTZ: false,

  toNumber: function (str) {
    'use strict'
    let s = ''
    let i, c
    const dp = INTERMediatorLocale.mon_decimal_point ? INTERMediatorLocale.mon_decimal_point : '.'
    str = str.toString()
    for (i = 0; i < str.length; i += 1) {
      c = str.charAt(i)
      if ((c >= '0' && c <= '9') || c === '.' || c === '-' ||
        c === dp) {
        s += c
      } else if (c >= '０' && c <= '９') {
        s += String.fromCharCode(c.charCodeAt(0) - '０'.charCodeAt(0) + '0'.charCodeAt(0))
      }
    }
    return parseFloat(s)
  },

  normalizeNumerics: function (value) {
    'use strict'
    let i
    const punc = INTERMediatorLocale.decimal_point ? INTERMediatorLocale.decimal_point : '.'
    const mpunc = INTERMediatorLocale.mon_decimal_point ? INTERMediatorLocale.mon_decimal_point : '.'
    let rule = '0123456789'
    if (punc) {
      rule += '\\' + punc
    }
    if (mpunc && mpunc !== punc) {
      rule += '\\' + mpunc
    }
    rule = '[^' + rule + ']'
    value = String(value)
    if (value && value.match(/[０１２３４５６７８９]/)) {
      for (i = 0; i < 10; i += 1) {
        value = value.split(String.fromCharCode(65296 + i)).join(String(i))
        // Full-width numeric characters start from 0xFF10(65296). This is convert to Full to ASCII char for numeric.
      }
      value = value.replace('．', '.')
    }
    return value ? parseFloat(value.replace(new RegExp(rule, 'g'), '')) : ''
  },

  /**
   * This method returns the rounded value of the 1st parameter to the 2nd parameter from decimal point
   * with a thousands separator.
   * @param {number} str The source value.
   * @param {integer} digit Positive number means after the decimal point, and negative means before it.
   * @param {string} decimalPoint
   * @param {string} thousandsSep
   * @param {string} currencySymbol
   * @param {object} flags
   * @returns {string}
   */

  numberFormatImpl: function (str, digit, decimalPoint, thousandsSep, currencySymbol, flags) {
    'use strict'
    let s, n, prefix, i, sign
    let tailSign = ''
    let power, underDot, underNumStr, pstr, roundedNum, underDecimalNum, integerNum,
      formatted, numStr, j, isMinusValue, numerals, numbers
    if (str === '' || str === null || str === undefined) {
      return ''
    }
    prefix = (String(str).substring(0, 1) === '-') ? '-' : ''
    if (String(str).match(/[-]/)) {
      str = prefix + String(str).split('-').join('')
    }
    n = IMLibFormat.toNumber(str)
    if (isNaN(n)) {
      return ''
    }
    if (flags === undefined) {
      flags = {}
    }

    sign = INTERMediatorLocale.positive_sign
    isMinusValue = false
    if (n < 0) {
      sign = INTERMediatorLocale.negative_sign
      if (flags.negativeStyle === 0 || flags.negativeStyle === 1) {
        sign = '-'
      } else if (flags.negativeStyle === 2) {
        sign = '('
        tailSign = ')'
      } else if (flags.negativeStyle === 3) {
        sign = '<'
        tailSign = '>'
      } else if (flags.negativeStyle === 4) {
        sign = ' CR'
      } else if (flags.negativeStyle === 5) {
        sign = '▲'
      }
      n = -n
      isMinusValue = true
    }

    if (flags.blankIfZero === true && n === 0) {
      return ''
    }

    if (flags.usePercentNotation) {
      n = n * 100
    }

    if (flags.upTo3Digits > 0) {
      n = n / Math.pow(10, flags.upTo3Digits)
    }

    underDot = (digit === undefined) ? INTERMediatorLocale.frac_digits : IMLibFormat.toNumber(digit)
    power = Math.pow(10, underDot)
    roundedNum = Math.round(n * power)
    underDecimalNum = (underDot > 0) ? roundedNum % power : 0
    integerNum = (roundedNum - underDecimalNum) / power
    underNumStr = (underDot > 0) ? String(underDecimalNum) : ''
    while (underNumStr.length < underDot) {
      underNumStr = '0' + underNumStr
    }

    if (flags.useSeparator === true) {
      if (n === 0) {
        formatted = '0'
      } else {
        n = integerNum
        s = []
        if (flags.kanjiSeparator === 1 || flags.kanjiSeparator === 2) {
          numerals = ['万', '億', '兆', '京', '垓', '𥝱', '穣', '溝',
            '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他',
            '不可思議', '無量大数']
          i = 0
          formatted = ''
          for (n = Math.floor(n); n > 0; n = Math.floor(n / 10000)) {
            if (n >= 10000) {
              pstr = '0000' + (n % 10000).toString()
            } else {
              pstr = (n % 10000).toString()
            }
            if (flags.kanjiSeparator === 1) {
              if (n >= 10000) {
                if (pstr.substr(pstr.length - 4) !== '0000') {
                  formatted = numerals[i] +
                    Number(pstr.substr(pstr.length - 4)) +
                    formatted
                } else {
                  if (numerals[i - 1] !== formatted.charAt(0)) {
                    formatted = numerals[i] + formatted
                  } else {
                    formatted = numerals[i] + formatted.slice(1)
                  }
                }
              } else {
                formatted = n + formatted
              }
            } else if (flags.kanjiSeparator === 2) {
              numStr = pstr.substr(pstr.length - 4)
              pstr = ''
              if (numStr === '0001') {
                pstr = '1'
              } else if (numStr !== '0000') {
                for (j = 0; j < numStr.length; j++) {
                  if (numStr.charAt(j) > 1) {
                    pstr = pstr + numStr.charAt(j)
                  }
                  if (numStr.charAt(j) > 0) {
                    if (numStr.length - j === 4) {
                      pstr = pstr + '千'
                    } else if (numStr.length - j === 3) {
                      pstr = pstr + '百'
                    } else if (numStr.length - j === 2) {
                      pstr = pstr + '十'
                    }
                  }
                }
              }
              if (n >= 10000) {
                if (pstr.length > 0) {
                  formatted = numerals[i] + pstr + formatted
                } else {
                  if (numerals[i - 1] !== formatted.charAt(0)) {
                    formatted = numerals[i] + formatted
                  } else {
                    formatted = numerals[i] + formatted.slice(1)
                  }
                }
              } else {
                if (numStr.length === 1) {
                  formatted = n + formatted
                } else {
                  formatted = pstr + formatted
                }
              }
            }
            i += 1
          }
          formatted = formatted +
            (underNumStr === '' ? '' : decimalPoint + underNumStr)
        } else {
          for (n = Math.floor(n); n > 0; n = Math.floor(n / 1000)) {
            if (n >= 1000) {
              pstr = '000' + (n % 1000).toString()
              s.push(pstr.substr(pstr.length - 3))
            } else {
              s.push(n)
            }
          }
          formatted = s.reverse().join(thousandsSep) +
            (underNumStr === '' ? '' : decimalPoint + underNumStr)
        }
        if (flags.negativeStyle === 0 || flags.negativeStyle === 5) {
          formatted = sign + formatted
        } else if (flags.negativeStyle === 1 || flags.negativeStyle === 4) {
          formatted = formatted + sign
        } else if (flags.negativeStyle === 2 || flags.negativeStyle === 3) {
          formatted = sign + formatted + tailSign
        } else {
          formatted = sign + formatted
        }
      }
    } else {
      formatted = integerNum + (underNumStr === '' ? '' : decimalPoint + underNumStr)
      if (flags.negativeStyle === 0 || flags.negativeStyle === 5) {
        formatted = sign + formatted
      } else if (flags.negativeStyle === 1 || flags.negativeStyle === 4) {
        formatted = formatted + sign
      } else if (flags.negativeStyle === 2 || flags.negativeStyle === 3) {
        formatted = sign + formatted + tailSign
      } else {
        formatted = sign + formatted
      }
    }

    if (formatted.indexOf(decimalPoint) === 0) {
      formatted = '0' + formatted
    }
    if (formatted.indexOf(sign + decimalPoint) === 0) {
      formatted = sign + Math.abs(formatted)
    }

    if (currencySymbol) {
      if (!isMinusValue) {
        if (parseInt(INTERMediatorLocale.p_cs_precedes) === 1) { // Stay operator "=="
          if (parseInt(INTERMediatorLocale.p_sep_by_space) === 1) { // Stay operator "=="
            formatted = currencySymbol + ' ' + formatted
          } else {
            formatted = currencySymbol + formatted
          }
        } else {
          if (parseInt(INTERMediatorLocale.p_sep_by_space) === 1) { // Stay operator '=='
            formatted = formatted + ' ' + currencySymbol
          } else {
            formatted = formatted + currencySymbol
          }
        }
      } else {
        if (parseInt(INTERMediatorLocale.n_cs_precedes) === 1) { // Stay operator "=="
          if (parseInt(INTERMediatorLocale.n_sep_by_space) === 1) { // Stay operator "=="
            formatted = currencySymbol + ' ' + formatted
          } else {
            formatted = currencySymbol + formatted
          }
        } else {
          if (parseInt(INTERMediatorLocale.n_sep_by_space) === 1) { // Stay operator '=='
            formatted = formatted + ' ' + currencySymbol
          } else {
            formatted = formatted + currencySymbol
          }
        }
      }
    }

    if (flags.charStyle) {
      if (flags.charStyle === 1) {
        for (i = 0; i < 10; i += 1) {
          formatted = String(formatted).split(String(i)).join(String.fromCharCode(65296 + i))
        }
      } else if (flags.charStyle === 2) {
        numbers = {
          0: '〇',
          1: '一',
          2: '二',
          3: '三',
          4: '四',
          5: '五',
          6: '六',
          7: '七',
          8: '八',
          9: '九'
        }
        for (i = 0; i < 10; i += 1) {
          formatted = String(formatted).split(String(i)).join(String(numbers[i]))
        }
      } else if (flags.charStyle === 3) {
        numbers = {
          0: '〇',
          1: '壱',
          2: '弐',
          3: '参',
          4: '四',
          5: '伍',
          6: '六',
          7: '七',
          8: '八',
          9: '九'
        }
        for (i = 0; i < 10; i += 1) {
          formatted = String(formatted).split(String(i)).join(String(numbers[i]))
        }
      }
    }

    if (flags.usePercentNotation === true && formatted !== '') {
      formatted = formatted + '%'
    }

    return formatted
  },

  getKanjiNumber: function (n) {
    'use strict'
    const s = []
    let count = 0
    String(n).split('').reverse().forEach(function (c) {
      s.push(IMLibFormat.kanjiDigit[count])
      count++
      s.push(IMLibFormat.kanjiNumbers[parseInt(c)])
    })
    return s.reverse().join('')
  },

  numberFormat: function (str, digit, flags) {
    'use strict'
    if (flags === undefined) {
      flags = {}
    }
    flags.useSeparator = true // for compatibility
    return this.decimalFormat(str, digit, flags)
  },

  percentFormat: function (str, digit, flags) {
    'use strict'
    if (typeof flags !== 'object') {
      flags = {}
    }
    flags.usePercentNotation = true
    return IMLibFormat.numberFormatImpl(str, digit,
      INTERMediatorLocale.mon_decimal_point ? INTERMediatorLocale.mon_decimal_point : '.',
      INTERMediatorLocale.mon_thousands_sep ? INTERMediatorLocale.mon_thousands_sep : ',',
      false,
      flags
    )
  },

  decimalFormat: function (str, digit, flags) {
    'use strict'
    return IMLibFormat.numberFormatImpl(str, digit,
      INTERMediatorLocale.mon_decimal_point ? INTERMediatorLocale.mon_decimal_point : '.',
      INTERMediatorLocale.mon_thousands_sep ? INTERMediatorLocale.mon_thousands_sep : ',',
      false,
      flags
    )
  },

  currencyFormat: function (str, digit, flags) {
    'use strict'
    return IMLibFormat.numberFormatImpl(str, digit,
      INTERMediatorLocale.mon_decimal_point ? INTERMediatorLocale.mon_decimal_point : '.',
      INTERMediatorLocale.mon_thousands_sep ? INTERMediatorLocale.mon_thousands_sep : ',',
      INTERMediatorLocale.currency_symbol ? INTERMediatorLocale.currency_symbol : '¥',
      flags
    )
  },

  booleanFormat: function (str, forms) {
    'use strict'
    let trueString = 'true'
    let falseString = 'false'
    let fmtStr
    const params = forms.split(',')
    if (params[0]) {
      fmtStr = params[0].trim()
      if (fmtStr.length > 0) {
        trueString = fmtStr
      }
    }
    if (params[1]) {
      fmtStr = params[1].trim()
      if (fmtStr.length > 0) {
        falseString = fmtStr
      }
    }
    if (str === '' || str === null) {
      return ''
    } else {
      if (parseInt(str, 10) !== 0) {
        return trueString
      } else {
        return falseString
      }
    }
  },

  datetimeFormat: function (str, params) {
    'use strict'
    return IMLibFormat.datetimeFormatImpl(str, params, 'datetime')
  },

  dateTimeLocalFormat: function (str, params) {
    'use strict'
    return IMLibFormat.datetimeFormatImpl(str, params, 'datetimelocal')
  },

  dateFormat: function (str, params) {
    'use strict'
    return IMLibFormat.datetimeFormatImpl(str, params, 'date')
  },

  timeFormat: function (str, params) {
    'use strict'
    return IMLibFormat.datetimeFormatImpl(str, params, 'time')
  },

  timeFormatLocal: function (str, params) {
    'use strict'
    return IMLibFormat.datetimeFormatImpl(str, params, 'timelocal')
  },

  placeHolder: {
    '%Y': Date.prototype.getFullYear, //
    '%y': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getFullYear())
    }, // 西暦2桁 17
    '%g': function () {
      'use strict'
      return IMLibFormat.getLocalYear(this, 1)
    }, // ロカールによる年数 平成29年
    '%G': function () {
      'use strict'
      return IMLibFormat.getLocalYear(this, 2)
    }, // ロカールによる年数 平成二十九年
    '%M': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getMonth() + 1)
    }, // 月2桁 07
    '%m': function () {
      'use strict'
      return this.getMonth() + 1
    }, // 月数値 7
    '%b': function () {
      'use strict'
      return INTERMediatorLocale.ABMON[this.getMonth()]
    }, // 短縮月名 Jul
    '%B': function () {
      'use strict'
      return INTERMediatorLocale.MON[this.getMonth()]
    }, // 月名 July
    '%t': function () {
      'use strict'
      return IMLibFormat.eMonAbbr[this.getMonth()]
    }, // 短縮月名 Jul
    '%T': function () {
      'use strict'
      return IMLibFormat.eMonName[this.getMonth()]
    }, // 月名 July
    '%D': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getDate())
    }, // 日2桁 12
    '%d': Date.prototype.getDate, // 日数値 12
    '%a': function () {
      'use strict'
      return IMLibFormat.eDayAbbr[this.getDay()]
    }, // 英語短縮曜日名 Mon
    '%A': function () {
      'use strict'
      return IMLibFormat.eDayName[this.getDay()]
    }, // 英語曜日名 Monday
    '%w': function () {
      'use strict'
      return INTERMediatorLocale.ABDAY[this.getDay()]
    }, // ロカールによる短縮曜日名 月
    '%W': function () {
      'use strict'
      return INTERMediatorLocale.DAY[this.getDay()]
    }, // ロカールによる曜日名 月曜日
    '%H': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getHours())
    }, // 時2桁 09
    '%h': Date.prototype.getHours, // 時数値 9
    '%J': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getHours() % 12)
    }, // 12時間制時2桁 09
    '%j': function () {
      'use strict'
      return this.getHours() % 12
    }, // 12時間制時数値 9
    '%K': function () {
      'use strict'
      const n = this.getHours() % 12
      return IMLibFormat.tweDigitsNumber(n === 0 ? 12 : n)
    }, // 12時間制時2桁 09
    '%k': function () {
      'use strict'
      const n = this.getHours() % 12
      return n === 0 ? 12 : n
    }, // 12時間制時数値 9
    '%I': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getMinutes())
    }, // 分2桁 05
    '%i': Date.prototype.getMinutes, // 分数値 5
    '%S': function () {
      'use strict'
      return IMLibFormat.tweDigitsNumber(this.getSeconds())
    }, // 秒2桁 00
    '%s': Date.prototype.getSeconds, // 秒数値 0
    '%P': function () {
      'use strict'
      return Math.floor(this.getHours() / 12) === 0 ? 'AM' : 'PM'
    }, // AM/PM AM
    '%p': function () {
      'use strict'
      return Math.floor(this.getHours() / 12) === 0 ? 'am' : 'pm'
    }, // am/pm am
    '%N': function () {
      'use strict'
      return Math.floor(this.getHours() / 12) === 0 ? INTERMediatorLocale.AM_STR : INTERMediatorLocale.PM_STR
    }, // am/pm am
    // '%Z': Date.prototype.getTimezoneOffset, // タイムゾーン省略名 JST
    // '%z': Date.prototype.getTimezoneOffset, // タイムゾーンオフセット +0900
    '%%': function () {
      'use strict'
      return '%'
    } // パーセント %
  },

  tweDigitsNumber: function (n) {
    'use strict'
    const v = parseInt(n)
    return ('0' + v.toString()).substr(-2, 2)
  },

  jYearStartDate: {
    '2019/5/1': '令和', '1989/1/8': '平成', '1926/12/25': '昭和', '1912/7/30': '大正', '1868/1/25': '明治'
  },
  eDayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  eDayAbbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  eMonName: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  eMonAbbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  kanjiNumbers: ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
  kanjiDigit: ['', '十', '百', '千', '万'],

  getLocalYear: function (dt, fmt) {
    'use strict'
    let gengoName, gengoYear, startDateStr, dtStart
    if (!dt) {
      return ''
    }
    gengoName = ''
    gengoYear = 0
    for (startDateStr in IMLibFormat.jYearStartDate) {
      if (IMLibFormat.jYearStartDate.hasOwnProperty(startDateStr)) {
        dtStart = new Date(startDateStr)
        if (dt >= dtStart) {
          gengoName = IMLibFormat.jYearStartDate[startDateStr]
          gengoYear = dt.getFullYear() - dtStart.getFullYear() + 1
          gengoYear = ((gengoYear === 1) ? '元' : (fmt === 2 ? IMLibFormat.getKanjiNumber(gengoYear) : gengoYear))
          break
        }
      }
    }
    return gengoName + gengoYear + '年'
  },

  datetimeFormatImpl: function (str, params, flags) {
    'use strict'
    let dt, c, result = '', replaced
    str = (Object.prototype.toString.call(str) === '[object Array]') ? str.join() : str
    const hasColon = str.indexOf(':') > -1
    const hasSlash = str.indexOf('/') > -1
    const hasDash = str.indexOf('-') > -1
    const kind = flags.trim().toUpperCase()
    if (kind == 'DATETIMELOCAL') {
      params = '%Y-%M-%DT%H:%I:%S'
      if (!hasColon && (hasSlash || hasDash)) {
        str += ' 00:00:00'
      }
    } else if (kind == 'TIMELOCAL') {
      const hasSecondColon = str.indexOf(':', str.indexOf(':') + 1)
      params = '%H:%I:%S'
      if (!hasColon) {
        str = '00:00:00'
      } else if (!hasSecondColon) {
        str += ':00'
      }
      const dtComp = str.split(':')
      const today = new Date()
      str = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2)
        + '-' + ('0' + today.getDate()).slice(-2) + 'T' + ('0' + dtComp[0]).slice(-2)
        + ':' + ('0' + dtComp[1]).slice(-2) + ':' + ('0' + dtComp[2]).slice(-2)
    } else {
      const paramStr = params.trim().toUpperCase()
      const key = kind.substr(0, 1) + '_FMT_' + paramStr
      if (INTERMediatorLocale[key]) {
        params = INTERMediatorLocale[key]
        if (kind === 'DATETIME') {
          params += ' ' + INTERMediatorLocale['T_FMT_' + paramStr]
        }
      }
      if (!hasColon && (hasSlash || hasDash)) {
        str += ' 00:00:00'
      } else if (hasColon && !hasSlash && !hasDash) {
        str = '1970/01/01 ' + str
      }
    }
    if (IMLibFormat.isFollowTZ) {
      str += '+0000'
    }
    dt = new Date(str)
    if (dt.toString() === 'Invalid Date') {
      dt = new Date(str.replace(/-/g, '/'))
    }
    if (dt.toString() === 'Invalid Date') {
      return ''
    }
    for (c = 0; c < params.length; c++) {
      if ((c + 1) < params.length && IMLibFormat.placeHolder[params.substr(c, 2)]) {
        replaced = (IMLibFormat.placeHolder[params.substr(c, 2)]).apply(dt)
        result += replaced
        c++
      } else {
        result += params.substr(c, 1)
      }
    }
    return result
  },

  convertNumeric: function (value) {
    'use strict'
    value = value.replace(new RegExp(INTERMediatorLocale.mon_thousands_sep, 'g'), '')
    value = IMLibFormat.normalizeNumerics(value)
    if (value !== '') {
      value = parseFloat(value)
    }
    return value
  },

  convertBoolean: function (value, forms) {
    'use strict'
    let trueString = 'true'
    let falseString = 'false'
    let fmtStr
    value = value.trim()
    const params = forms.split(',')
    if (params[0]) {
      fmtStr = params[0].trim()
      if (fmtStr.length > 0) {
        trueString = fmtStr
      }
    }
    if (params[1]) {
      fmtStr = params[1].trim()
      if (fmtStr.length > 0) {
        falseString = fmtStr
      }
    }
    if (value === trueString) {
      return true
    } else if (value === falseString) {
      return false
    }
    return null
  },

  convertPercent: function (value) {
    'use strict'
    value = value.replace(new RegExp(INTERMediatorLocale.mon_thousands_sep, 'g'), '')
    value = value.replace('%', '')
    value = IMLibFormat.normalizeNumerics(value)
    if (value !== '') {
      value = parseFloat(value) / 100
    }
    return value
  },

  convertDate: function (value, params) {
    'use strict'
    return IMLibFormat.convertDateTimeImpl(value, params, 'date')
  },
  convertTime: function (value, params) {
    'use strict'
    return IMLibFormat.convertDateTimeImpl(value, params, 'time')
  },

  convertDateTime: function (value, params) {
    'use strict'
    return IMLibFormat.convertDateTimeImpl(value, params, 'datetime')
  },

  convertDateTimeLocal: function (value, params) {
    'use strict'
    return IMLibFormat.convertDateTimeImpl(value, params, 'datetimelocal')
  },

  convertTimeLocal: function (value, params) {
    'use strict'
    return IMLibFormat.convertDateTimeImpl(value, params, 'timelocal')
  },

  convertDateTimeImpl: function (value, params, flags) {
    'use strict'
    let c, dt, result, regexp = '', replacement = []
    let r, matched, y, m, d, h, i, s, paramStr, key, mon, anotherParams = null
    const kind = flags.trim().toUpperCase()
    IMLibFormat.reverseRegExp['%N'] =
      '(' + (typeof (INTERMediatorLocale) == 'undefined' ? 'AM' : INTERMediatorLocale.AM_STR)
      + '|' + (typeof (INTERMediatorLocale) == 'undefined' ? 'PM' : INTERMediatorLocale.PM_STR) + ')'
    if (kind == 'DATETIMELOCAL') {
      params = '%Y-%m-%dT%H:%i:%s'
      anotherParams = '%Y-%m-%dT%H:%i'
    } else if (kind == 'TIMELOCAL') {
      params = '%H:%i:%s'
      anotherParams = '%H:%i'
    } else {
      paramStr = params.trim().toUpperCase()
      key = kind.substr(0, 1) + '_FMT_' + paramStr
      if (INTERMediatorLocale[key]) {
        params = INTERMediatorLocale[key]
        if (kind === 'DATETIME') {
          params += ' ' + INTERMediatorLocale['T_FMT_' + paramStr]
        }
      }
      params = params.replace(/([\(\)])/g, '\\$1')
    }
    [regexp, replacement] = getRegExp(params)
    matched = (new RegExp(regexp)).exec(value)
    if (!matched && anotherParams) {
      [regexp, replacement] = getRegExp(anotherParams)
      matched = (new RegExp(regexp)).exec(value)
    }
    result = value
    if (matched) {
      for (c = 0; c < replacement.length; c++) {
        switch (replacement[c]) {
          case '%Y':
          case '%y':
            y = matched[c + 1]
            break
          case '%M':
          case '%m':
            m = getTwoDigitString(matched[c + 1])
            break
          case '%T':
          case '%t':
            mon = matched[c + 1]
            m = IMLibFormat.eMonAbbr.indexOf(mon.substr(0, 1).toUpperCase() + mon.substr(1, 2).toLowerCase())
            m = getTwoDigitString(m + 1)
            break
          case '%D':
          case '%d':
            d = getTwoDigitString(matched[c + 1])
            break
          case '%H':
          case '%h':
            h = getTwoDigitString(matched[c + 1])
            break
          case '%I':
          case '%i':
            i = getTwoDigitString(matched[c + 1])
            break
          case '%S':
          case '%s':
            s = getTwoDigitString(matched[c + 1])
            break
        }
      }
      if (y && m && d && h && i) {
        dt = new Date(y + '-' + m + '-' + d + 'T' + h + ':' + i + ':' + (s ? s : '00'))
        if (IMLibFormat.isFollowTZ) {
          result = getUTCDateString(dt) + ' ' + getUTCTimeString(dt)
        } else {
          result = getDateString(dt) + ' ' + getTimeString(dt)
        }
      } else if (y && m && d) {
        dt = new Date(y + '-' + m + '-' + d)
        result = getDateString(dt)
      } else if (h && i) {
        dt = new Date()
        dt.setHours(h, i, (s ? s : '00'))
        if (IMLibFormat.isFollowTZ) {
          result = getUTCTimeString(dt)
        } else {
          result = getTimeString(dt)
        }
      }
    }
    return result

    function getRegExp(params) {
      let regexp = '', replacement = []
      for (let c = 0; c < params.length; c++) {
        if ((c + 1) < params.length && IMLibFormat.reverseRegExp[params.substr(c, 2)]) {
          regexp += IMLibFormat.reverseRegExp[params.substr(c, 2)]
          replacement.push(params.substr(c, 2))
          c++
        } else {
          regexp += params.substr(c, 1)
        }
      }
      return [regexp, replacement]
    }

    function getDateString(dt) {
      return dt.getFullYear()
        + '-' + ('0' + (dt.getMonth() + 1)).slice(-2)
        + '-' + ('0' + dt.getDate()).slice(-2)
    }

    function getUTCDateString(dt) {
      return dt.getUTCFullYear()
        + '-' + ('0' + (dt.getUTCMonth() + 1)).slice(-2)
        + '-' + ('0' + dt.getUTCDate()).slice(-2)
    }

    function getTimeString(dt) {
      return ('0' + dt.getHours()).slice(-2)
        + ':' + ('0' + dt.getMinutes()).slice(-2)
        + ':' + ('0' + dt.getSeconds()).slice(-2)
    }

    function getUTCTimeString(dt) {
      return ('0' + dt.getUTCHours()).slice(-2)
        + ':' + ('0' + dt.getUTCMinutes()).slice(-2)
        + ':' + ('0' + dt.getUTCSeconds()).slice(-2)
    }

    function getTwoDigitString(s) {
      if (s === null || isNaN(s) || typeof s === 'undefined') {
        return s
      }
      return ('00' + s).slice(-2)
    }
  },

  reverseRegExp: {
    '%Y': '([\\d]{4})', //
    '%y': '([\\d]{2})', // 西暦2桁 17
    '%g': '(明治|大正|昭和|平成|令和)(元|[\\d]{1,2})年', // ロカールによる年数 平成29年
    '%G': '(明治|大正|昭和|平成|令和)(.+)年', // ロカールによる年数 平成二十九年
    '%M': '([\\d]{1,2})', // 月2桁 07
    '%m': '([\\d]{1,2})', // 月数値 7
    '%b': '(.+)', // 短縮月名 Jul
    '%B': '(.+)', // 月名 July
    '%t': '(.+)', // 短縮月名 Jul
    '%T': '(.+)', // 月名 July
    '%D': '([\\d]{1,2})', // 日2桁 12
    '%d': '([\\d]{1,2})', // 日数値 12
    '%a': '(.+)', // 英語短縮曜日名 Mon
    '%A': '(.+)', // 英語曜日名 Monday
    '%w': '(.+)', // ロカールによる短縮曜日名 月
    '%W': '(.+)', // ロカールによる曜日名 月曜日
    '%H': '([\\d]{1,2})', // 時2桁 09
    '%h': '([\\d]{1,2})', // 時数値 9
    '%J': '([\\d]{1,2})', // 12時間制時2桁 09
    '%j': '([\\d]{1,2})', // 12時間制時数値 9
    '%K': '([\\d]{1,2})', // 12時間制時2桁 09
    '%k': '([\\d]{1,2})', // 12時間制時数値 9
    '%I': '([\\d]{1,2})', // 分2桁 05
    '%i': '([\\d]{1,2})', // 分数値 5
    '%S': '([\\d]{1,2})', // 秒2桁 00
    '%s': '([\\d]{1,2})', // 秒数値 0
    '%P': '(AM|PM)', // AM/PM AM
    '%p': '(am|pm)', // am/pm am
    '%N': '(AM|PM)', // am/pm am
    '%%': '[\%]' // パーセント %
  }
}

// @@IM@@IgnoringRestOfFile
module.exports = IMLibFormat
