import isInBrowser from 'is-in-browser'
import prefix from './prefix'
import supportedProperty from './supported-property'

const cache = {}
const transitionProperties = {
  transition: 1,
  'transition-property': 1,
  '-webkit-transition': 1,
  '-webkit-transition-property': 1
}
const transPropsRegExp = /(^\s*\w+)|, (\s*\w+)/g
let el

function prefixTransitionCallback(match, p1, p2) {
  if (p1 === 'all') return 'all'
  if (p2 === 'all') return ', all'
  return p1 ? supportedProperty(p1) : `, ${supportedProperty(p2)}`
}

if (isInBrowser) el = document.createElement('p')

/**
 * Returns prefixed value if needed. Returns `false` if value is not supported.
 *
 * @param {String} property
 * @param {String} value
 * @return {String|Boolean}
 * @api public
 */

export default function supportedValue(property, value) {
  // For server-side rendering.
  if (!el) return value

  // It is a string or a number as a string like '1'.
  // We want only prefixable values here.
  // eslint-disable-next-line no-restricted-globals
  if (typeof value !== 'string' || !isNaN(parseInt(value, 10))) {
    return value
  }

  const cacheKey = property + value

  if (process.env.NODE_ENV !== 'benchmark' && cache[cacheKey] != null) {
    return cache[cacheKey]
  }

  // IE can even throw an error in some cases, for e.g. style.content = 'bar's
  try {
    // Test value as it is.
    el.style[property] = value
  }
  catch (err) {
    cache[cacheKey] = false
    return false
  }

  if (transitionProperties[property]) {
    value = value.replace(transPropsRegExp, prefixTransitionCallback)
  }
  else if (el.style[property] === '') {
    // Test value with vendor prefix.
    value = prefix.css + value

    // Hardcode test to convert "flex" to "-ms-flexbox" for IE10.
    if (value === '-ms-flex') value = '-ms-flexbox'

    el.style[property] = value

    if (el.style[property] === '') {
      cache[cacheKey] = false
      return false
    }
  }

  // Reset style value.
  el.style[property] = ''

  cache[cacheKey] = value

  return cache[cacheKey]
}
