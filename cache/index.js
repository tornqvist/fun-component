// cache element and reuse on consecutive mounts
// () -> fn
module.exports = function init () {
  var initialized = false

  return function cache (ctx) {
    if (!initialized) {
      initialized = true

      ctx.on('beforerender', function (ctx, element) {
        ctx.cached = element
      })

      // proxy render method returning cached element when applicable
      var render = ctx.render
      ctx.render = function () {
        if (!ctx.element && ctx.cached) return ctx.cached
        return render.apply(ctx, Array.prototype.slice.call(arguments))
      }
    }
  }
}
