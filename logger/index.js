var Nanologger = require('nanologger');

var HOOKS = ['load', 'unload', 'beforerender', 'afterupdate', 'afterreorder'];

module.exports = function init(options) {
  return function logger(ctx) {
    if (!ctx.log) {
      ctx.log = new Nanologger(ctx._name, options);

      var _handleRender = ctx._handleRender;
      ctx._handleRender = function (args) {
        ctx.log.debug(ctx.element ? 'update' : 'render', args);
        var el = _handleRender.call(ctx, args);
        HOOKS.forEach(function (key) {
          var hook = ctx[key];
          if (hook) {
            ctx[key] = function () {
              ctx.log.debug(key, args);
              return hook.apply(this, Array.prototype.slice.call(arguments));
            };
          }
        });
        return el;
      };
    }

    return ctx;
  };
};
