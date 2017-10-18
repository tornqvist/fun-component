module.exports = function init() {
  return function cache(ctx) {
    var callback;

    if (!ctx.cached) {
      Object.defineProperties(ctx, 'load', {
        configurable: true,
        enumerable: true,
        set: function (fn) { callback = fn; },
        get: function () { return load; }
      });

      var createElement = ctx.createElement;
      ctx.createElement = function () {
        if (!ctx._loaded && ctx.cached) {
          return ctx.cached;
        }
        return createElement.apply(ctx, Array.prototype.slice.call(arguments));
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
