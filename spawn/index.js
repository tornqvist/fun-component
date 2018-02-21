var assert = require('nanoassert')
var Context = require('../').Context

// spawn component contexts on demand and optionally discard on unload
// (fn, obj?) -> fn
module.exports = function init (identity, opts) {
  assert(typeof identity === 'function', 'fun-component: identity should be a function')
  opts = opts || {}

  var cache = opts.cache || {}

  return function spawn (source) {
    var name = source._name
    var render = source._render
    var events = source._events
    var args = Array.prototype.slice.call(arguments, 1)
    var id = identity.apply(undefined, args)

    assert(typeof id === 'string', 'fun-component: identity should return a string')

    var ctx = typeof cache.get === 'function' ? cache.get(id) : cache[id]

    if (!ctx) {
      // spawn a new context
      ctx = new Context([name, id].join('_'), render)
      if (typeof cache.set === 'function') cache.set(id, ctx)
      else cache[id] = ctx

      if (!opts.persist) {
        // remove context from cache on unload
        ctx.on('unload', function () {
          if (typeof cache.remove === 'function') cache.remove(id)
          else delete cache[id]
        })
      }

      // copy over all lifecycle event listeners to the new context
      var keys = Object.keys(source._events)
      for (var i = 0, len = keys.length; i < len; i++) {
        addEventListeners(ctx, keys[i], events[keys[i]])
      }
    }

    return ctx
  }
}

function addEventListeners (ctx, event, listeners) {
  for (var i = 0, len = listeners.length; i < len; i++) {
    ctx.on(event, listeners[i])
  }
}
