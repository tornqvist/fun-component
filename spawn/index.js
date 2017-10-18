var assert = require('nanoassert');
var Context = require('../').Context;

module.exports = function init(identity) {
  assert(typeof identity === 'function', 'identity is required');

  var cache = {};

  return function spawn(source, args) {
    var callback;
    var name = source._name;
    var render = source._render;
    var key = identity.apply(undefined, args);

    assert(key, 'could not identify key');

    var ctx = cache[key];

    if (!ctx) {
      ctx = cache[key] = new Context([name, key].join('_'), render);
      Object.defineProperty(ctx, 'unload', {
        configurable: true,
        enumerable: true,
        set: function (fn) { callback = fn; },
        get: function () { return unload; }
      });
    }

    function unload() {
      delete cache[key];
      if (callback) {
        return callback.apply(this, Array.prototype.slice.call(arguments));
      }
    }

    return ctx;
  };
};
