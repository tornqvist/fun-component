var assert = require('nanoassert')
var Component = require('nanocomponent')
var stack = require('./stack')

var UNDEFINED

module.exports = component

function FunComponent (name) {
  Component.call(this, name)
  this._stack = []
  this._hooks = {}
  this._hid = 0
}

FunComponent.prototype = Object.create(Component.prototype)
FunComponent.prototype.constructor = FunComponent

FunComponent.prototype.addHook = function (type, fn) {
  var self = this
  var id = this._hid++
  // TODO: remove hooks from last round
  var node = this._stack[id] = [type, hook]
  assert(node[0] === type, 'fun-component: hook order mismatch, you should not change the order in which hooks are called')

  var hooks = this._hooks[type] = this._hooks[type] || []
  hooks.push(hook)

  function hook () {
    var _hid = self._hid
    stack.push(self)
    var val = fn.apply(this, arguments)
    assert(_hid === self._hid, 'fun-component: ')
    stack.pop()
    return val
  }
}

Object.defineProperties(FunComponent.prototype, {
  load: {
    get: (function () {
      var proxied = proxy('load')
      return function () {
        var load = proxied.call(this)
        if (!load) return
        return function () {
          var res = load.apply(this, arguments)
          if (typeof res === 'function') this.unload = res
          return res
        }
      }
    }())
  },
  unload: {
    set: function (fn) {
      if (!this._hooks.unload) this._hooks.unload = []
      this._hooks.unload.push(fn)
    },
    get: (function () {
      var proxied = proxy('unload')
      return function () {
        var unload = proxied.call(this)
        if (!unload) return
        return function () {
          var res = unload.apply(this, arguments)
          delete this._hooks.unload
          return res
        }
      }
    }())
  },
  beforerender: { get: proxy('beforerender') },
  afterupdate: { get: proxy('afterupdate') },
  update: {
    get: (function () {
      var proxied = proxy('update')
      return function () {
        if (!this._hooks.update) return true
        return proxied.apply(this, arguments)
      }
    }())
  }
})

function proxy (type) {
  return function () {
    var hooks = this._hooks[type]
    if (!hooks) return
    return function () {
      var self = this
      var args = arguments
      return hooks.reduce(function (prev, hook) {
        var value = hook.apply(self, args)
        return prev || value
      }, UNDEFINED)
    }
  }
}

function component (name, render) {
  if (typeof name === 'function') {
    render = name
    name = 'fun-component'
  }

  assert(typeof render === 'function', 'fun-component: render should be typ function')
  assert(typeof name === 'string', 'fun-component: name should be type string')

  var instance = new FunComponent(name)
  var _render = instance.render
  instance.render = function () {
    stack.push(instance)
    var res = _render.apply(this, arguments)
    stack.pop()
    return res
  }
  instance.createElement = function () {
    this._hid = 0
    var prev = this._hooks.length
    var val = render.apply(UNDEFINED, arguments)
    assert(prev === this._hooks.length, 'fun-component: hook count mismatch, you should not change the order in which hooks are called')
    return val
  }

  return instance.render.bind(instance)
}
