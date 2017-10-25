var assert = require('nanoassert')
var Context = require('../').Context

// spawn component contexts on demand and discard on unload
// fn -> fn
module.exports = function init (identity) {
  assert(typeof identity === 'function', 'identity is required')

  var cache = {}

  return function spawn (source) {
    var callback
    var name = source._name
    var render = source._render
    var args = Array.prototype.slice.call(arguments, 1)
    var key = identity.apply(undefined, args)

    assert(key, 'could not identify key')

    var ctx = cache[key]

    if (!ctx) {
      // spawn a new context
      ctx = cache[key] = new Context([name, key].join('_'), render)

      // proxy unload and capture the callback when being set
      Object.defineProperty(ctx, 'unload', {
        configurable: true,
        enumerable: true,
        set: function (fn) { callback = fn },
        get: function () { return unload }
      })
    }

    function unload () {
      // discard context on unload
      delete cache[key]
      if (callback) {
        // call captured callback
        return callback.apply(this, Array.prototype.slice.call(arguments))
      }
    }

    return ctx
  }
}
