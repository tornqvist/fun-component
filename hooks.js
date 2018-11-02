var stack = require('./stack')

module.exports.use = use
module.exports.element = element
module.exports.load = bind('load')
module.exports.update = bind('update')
module.exports.beforerender = bind('beforerender')
module.exports.afterupdate = bind('afterupdate')

function use (fn) {
  var args = Array.prototype.slice.call(arguments)
  args.unshift(stack.last)
  return fn.apply(undefined, args)
}

function element () {
  return stack.last.element
}

function bind (type) {
  return function (fn) {
    stack.last.addHook(type, fn)
  }
}
