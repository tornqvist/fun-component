// cache element and reuse on consecutive mounts
// () -> fn
module.exports = function init () {
  return function cache (ctx) {
    var callback

    if (!ctx.cached) {
      // proxy load and capture callback when being set
      Object.defineProperty(ctx, 'load', {
        configurable: true,
        enumerable: true,
        set: function (fn) { callback = fn },
        get: function () { return load }
      })

      // proxy render method returning cached element when applicable
      var render = ctx.render
      ctx.render = function () {
        if (!ctx._loaded && ctx.cached) {
          return ctx.cached
        }
        return render.apply(ctx, Array.prototype.slice.call(arguments))
      }
    }

    function load () {
      // cache mounted element
      ctx.cached = ctx.element
      if (callback) {
        // call captured callback
        return callback.apply(this, Array.prototype.slice.call(arguments))
      }
    }

    return ctx
  }
}
