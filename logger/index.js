var Nanologger = require('nanologger')

var EVENTS = ['load', 'unload', 'beforerender', 'afterupdate', 'afterreorder']

// add logger to context and log all lifycycle event
// obj -> fn
module.exports = function init (options) {
  return function logger (ctx) {
    if (!ctx.log) {
      ctx.log = new Nanologger(ctx._name, options)

      for (var i = 0, len = EVENTS.length; i < len; i++) {
        ctx.on(EVENTS[i], createListener(EVENTS[i]))
      }

      // proxy render capturing lifecycle events
      var render = ctx.render
      ctx.render = function () {
        var args = Array.prototype.slice.call(arguments)
        if (ctx.element) ctx.log.debug('update', args)
        var element = render.call(ctx, args)
        if (!ctx.element) ctx.log.debug('render', args)
        return element
      }
    }

    function createListener (event) {
      return function () {
        ctx.log.debug(event, Array.prototype.slice.call(arguments, 1))
      }
    }
  }
}
