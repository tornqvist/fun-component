var assert = require('nanoassert')
var Nanocomponent = require('nanocomponent')

var NAME = 'fun-component'

module.exports = component
module.exports.Context = Context

// create a function that proxies nanocomponent
// (str, fn) -> fn
function component (name, render) {
  if (typeof name === 'function') {
    render = name
    name = render.name || NAME
  }

  var middleware = []
  var context = new Context(name, render)

  function renderer () {
    var ctx = context
    var args = Array.prototype.slice.call(arguments)
    var forward = [ctx]
    forward.push.apply(forward, args)
    for (var i = 0, len = middleware.length, next; i < len; i++) {
      next = middleware[i].apply(undefined, forward)
      if (next && next !== ctx) {
        assert(typeof ctx.render === 'function', 'fun-component: plugin should return a component context')
        ctx = next
        forward.splice(0, 1, next)
      }
    }
    return ctx.render.apply(ctx, args)
  }

  Object.defineProperties(renderer, {
    use: {
      get: function () { return use }
    },
    on: {
      get: function () { return context.on.bind(context) }
    },
    off: {
      get: function () { return context.off.bind(context) }
    },
    fork: {
      get: function () { return fork }
    }
  })

  Object.defineProperty(renderer, 'name', {
    value: name,
    writable: false,
    enumerable: false,
    configurable: true
  })

  // add plugin middleware
  // fn -> void
  function use (fn) {
    middleware.push(fn)
  }

  // fork a component inheriting all event listeners and middleware
  // str? -> fn
  function fork (_name) {
    var forked = component(_name || name, render)
    var events = Object.keys(context._events)
    for (var e = 0, elen = events.length, listeners, l, llen; e < elen; e++) {
      listeners = context._events[events[e]]
      for (l = 0, llen = listeners.length; l < llen; l++) {
        forked.on(events[e], listeners[l])
      }
    }
    for (var m = 0, mlen = middleware.length; m < mlen; m++) {
      forked.use(middleware[m])
    }
    return forked
  }

  return renderer
}

// custom extension of nanocomponent
// (str, fn) -> Context
function Context (name, render) {
  assert(typeof name === 'string', 'fun-component: name should be a string')
  assert(typeof render === 'function', 'fun-component: render should be a function')
  Nanocomponent.call(this, name)
  var ctx = this
  this._events = {}
  this._render = render
  this.createElement = function () {
    var args = Array.prototype.slice.call(arguments)
    args.unshift(ctx)
    return render.apply(undefined, args)
  }
}

Context.prototype = Object.create(Nanocomponent.prototype)
Context.prototype.contructor = Context

Context.prototype.update = update

// add lifecycle event listener
// (str, fn) -> void
Context.prototype.on = function (event, listener) {
  assert(typeof event === 'string', 'fun-component: event should be a string')
  assert(typeof listener === 'function', 'fun-component: listener should be a function')

  var events = this._events[event]
  if (!events) events = this._events[event] = []
  events.push(listener)

  if (!this[event] || (event === 'update' && this.update === update)) {
    this[event] = function () {
      var result
      var args = Array.prototype.slice.call(arguments)
      var events = this._events[event]

      if (event === 'update') {
        // compose `update` arguments for diffing
        args = [this, args, this._arguments]
      } else {
        args.unshift(this)
        args.push.apply(args, this._arguments)
      }

      // run through all events listeners in order, aggregating return value
      for (var i = 0, len = events.length, next; i < len; i++) {
        next = events[i].apply(undefined, args)
        if (event === 'update' && i > 0) result = result || next
        else result = next
      }
      if (event === 'update') return result
    }
  }
}

// remove lifecycle event listener
// (str, fn) -> void
Context.prototype.off = function (event, listener) {
  assert(typeof event === 'string', 'fun-component: event should be a string')
  assert(typeof listener === 'function', 'fun-component: listener should be a function')

  var events = this._events[event]
  if (!events) return

  var index = events.indexOf(listener)
  if (index === -1) return

  events.splice(index, 1)

  // remove depleeted listener proxy method
  if (!events.length) delete this[event]
}

// simple shallow diff of two sets of arguments
// (arr, arr) -> bool
function update () {
  var result = false
  var args = Array.prototype.slice.call(arguments)
  var prev = this._arguments

  // different lengths issues rerender
  if (args.length !== this._arguments.length) return true

  // make best effort to compare element as argument, fallback to shallow diff
  for (var i = 0, len = args.length, arg; i < len; i++) {
    arg = args[i]
    if (arg && arg.isSameNode) result = result || !arg.isSameNode(prev[i])
    else result = result || arg !== prev[i]
  }

  return result
}
