module.exports = function init() {
  return function cache(ctx) {
    var callback;

    if (!ctx.cached) {
      Object.defineProperty(ctx, 'load', {
        configurable: true,
        enumerable: true,
        set: function (fn) { callback = fn; },
        get: function () { return load; }
      });

      var render = ctx.render;
      ctx.render = function () {
        if (!ctx._loaded && ctx.cached) {
          return ctx.cached;
        }
        return render.apply(ctx, Array.prototype.slice.call(arguments));
      };
    }

    function load() {
      ctx.cached = ctx.element;
      if (callback) {
        return callback.apply(this, Array.prototype.slice.call(arguments));
      }
    }

    return ctx;
  };
};
