var assert = require('nanoassert');
var nanologger = require('nanologger');
var Nanocomponent = require('nanocomponent');

var HOOKS = ['load', 'unload', 'beforerender', 'afterupdate', 'afterreorder'];

module.exports = component;

/**
 * Lifecycle hooks for a statefull component.
 *
 * @param {any} name Explicit name or render function
 * @param {function} [render] Should return an HTMLElement
 * @returns {function} Renders component
 */

function component(name, render) {
  var _args, _update;

  /**
   * Derrive the render function to use for `createElement`
   */

  if (typeof name === 'function') {
    render = name;
    name = render.name || 'fun-component';
  }

  assert(render, 'Component must be provided with a render function');

  function Component() {
    Nanocomponent.call(this, name);
    this.debug('create');
  }

  Component.prototype = Object.create(Nanocomponent.prototype);

  /**
   * Add on an extra layer to the prototype with an instnace of nanologger
   */

  Object.assign(Component.prototype, nanologger(name));

  /**
   * Default to shallow diff and capture arguments on update
   */

  Component.prototype.update = function () {
    var result;
    var args = Array.prototype.slice.call(arguments);

    if (_update) {
      result = _update.call(this, this.element, args, _args);
    } else {
      result = diff(args, _args);
    }

    if (result) {
      this.debug('update', args);
    }

    _args = args;

    return result;
  };

  /**
   * Capture arguments on render
   */

  Component.prototype.createElement = function() {
    var args = Array.prototype.slice.call(arguments);

    if (!this.element) {
      this.debug('render', args);
    }

    _args = args;

    return render.apply(this, args);
  };

  /**
   * Pluck out lifecycle hooks from element and attach to self
   */

  Component.prototype._handleRender = function(args) {
    var self = this;
    var el = Nanocomponent.prototype._handleRender.call(this, args);

    for (var i = 0; i < HOOKS.length; i += 1) {
      var hook = HOOKS[i];

      if (el.hasOwnProperty('on' + hook)) {
        this[hook] = function () {
          this.debug(hook, _args);
          el['on' + hook].apply(self, Array.prototype.concat.call(arguments, _args));
        };

        el['on' + hook] = null;
      }
    }

    if (el.hasOwnProperty('onupdate')) {
      _update = el.onupdate;
      el.onupdate = null;
    }

    return el;
  };

  /**
   * Create an instance of the new component
   */

  var component = new Component();

  /**
   * Create a middleman render method
   */

  function renderer() {
    var args = Array.prototype.slice.call(arguments);
    return component.render.apply(component, args);
  }

  /**
   * Overwrite function name with the original name
   */

  Object.defineProperty(renderer, 'name', { writable: true });
  renderer.name = name;

  /**
   * Expose just the wrapper function
   */

  return renderer;
}

/**
 * Simple shallow diff of two sets of arguments
 *
 * @param {array} args
 * @param {array} prev
 * @returns {boolean}
 */

function diff(args, prev) {
  // A different set of arguments issues a rerender
  if (args.length !== prev.length) { return true; }

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
      return diff || arg !== prev[index];
    }
  }, false);
}
