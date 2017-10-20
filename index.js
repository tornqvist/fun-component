var assert = require('nanoassert')
var Nanocomponent = require('nanocomponent')
var setName = require('function-name')

var NAME = 'fun-component'
var HOOKS = ['load', 'unload', 'beforerender', 'afterupdate', 'afterreorder']

module.exports = component
module.exports.Context = Context

/**
 * Create a functional wrapper for nanocomponent
 * @param {any} name Explicit name or render function
 * @param {function} [render] Create an HTMLElement
 * @returns {function} Renders component
 */

function component (name, render) {
  if (typeof name === 'function') {
    render = name
    name = Object.getOwnPropertyDescriptor(render, 'name').value || NAME
  }

  var middleware = []
  var context = new Context(name, render)

  setName(renderer, name)
  function renderer () {
    var args = Array.prototype.slice.call(arguments)

    return middleware.concat(function (ctx) {
      assert(typeof ctx.render === 'function', 'plugin must return context')
      return ctx.render.apply(ctx, args)
    }).reduce(function (ctx, plugin) {
      return plugin.apply(undefined, [ctx].concat(args))
    }, context)
  }

  Object.defineProperty(renderer, 'use', {
    get: function () { return use }
  })

  function use (fn) {
    middleware.push(fn)
  }

  return renderer
}

/**
 * Custom extention of Nanocomponent
 *
 * @param {string} name Component name
 * @param {function} render Should return Element
 */

function Context (name, render) {
  assert(typeof name === 'string', 'missing name')
  assert(typeof render === 'function', 'missing render function')
  Nanocomponent.call(this, name)
  this._render = render
  var ctx = this
  this.createElement = function () {
    var args = Array.prototype.slice.call(arguments)
    return render.apply(undefined, [ctx].concat(args))
  }
}

/**
 * Mixin both Nanocomponent and Nanologger on Context prototype tree
 */

Context.prototype = Object.create(Nanocomponent.prototype)

/**
 * Default to shallow diff and capture arguments on update
 */

Context.prototype.update = function () {
  var result
  var args = Array.prototype.slice.call(arguments)

  if (this._update) {
    result = this._update(this, args, this._arguments)
  } else {
    result = diff(args, this._arguments)
  }

  this._arguments = args

  return result
}

/**
 * Pluck out lifecycle hooks from element and attach to self
 */

Context.prototype._handleRender = function (args) {
  var ctx = this
  var el = Nanocomponent.prototype._handleRender.call(this, args)

  HOOKS.forEach(function (key) {
    var hook = el['on' + key]

    if (hook) {
      ctx[key] = function () {
        return hook.apply(undefined, [ctx].concat(ctx._arguments))
      }
      el['on' + key] = null
    }
  })

  if (el.onupdate) {
    this._update = el.onupdate.bind(undefined)
    el.onupdate = null
  }

  return el
}

/**
 * Simple shallow diff of two sets of arguments
 *
 * @param {array} args
 * @param {array} prev
 * @returns {boolean}
 */

function diff (args, prev) {
  // A different set of arguments issues a rerender
  if (args.length !== prev.length) { return true }

  // Check for shallow diff in list of arguments
  return args.reduce(function (diff, arg, index) {
    if (prev[index] && prev[index].isSameNode && arg instanceof Element) {
      // Handle argument being an element
      return diff || !arg.isSameNode(prev[index]);
    } else if (typeof arg === 'function') {
      // Compare argument as callback
      return diff || arg.toString() !== prev[index].toString();
    } else {
      // Just plain compare
      return diff || arg !== prev[index]
    }
  }, false)
}
