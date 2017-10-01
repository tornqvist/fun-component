var assert = require('nanoassert');
var Nanologger = require('nanologger');
var Nanocomponent = require('nanocomponent');

var HOOKS = ['load', 'unload', 'beforerender', 'afterupdate', 'afterreorder'];

module.exports = component;

/**
 * Lifecycle hooks for a statefull component.
 *
 * @param {any} name Explicit name or render function
 * @param {function} [render] Create an HTMLElement
 * @returns {function} Renders component
 */

function component(name, render) {

  /**
   * Derrive the render function to use for `createElement`
   */

  if (typeof name === 'function') {
    render = name;
    name = render.name || 'fun-component';
  }

  assert(render, 'Component must be provided with a render function');

  function Component() {
    Nanocomponent.call(this, arguments[0] || name);
    this.cache = {};
    this.debug('create');
  }

  /**
   * Mixin both Nanocomponent and Nanologger on Component prototype tree
   */

  Component.prototype = Object.create(Nanocomponent.prototype);
  Object.assign(Component.prototype, new Nanologger(name), Nanologger.prototype);
  Component.prototype.constructor = Component;

  /**
   * Default to shallow diff and capture arguments on update
   */

  Component.prototype.update = function () {
    var result;
    var args = Array.prototype.slice.call(arguments);

    if (this._update) {
      result = this._update.call(this, this.element, args, this._arguments);
    } else {
      result = diff(args, this._arguments);
    }

    if (result) {
      this.debug('update', args);
    }

    this._arguments = args;

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

    return render.apply(this, args);
  };

  /**
   * Pluck out lifecycle hooks from element and attach to self
   */

  Component.prototype._handleRender = function(args) {
    var self = this;
    var el = Nanocomponent.prototype._handleRender.call(this, args);

    HOOKS.forEach(function (key) {
      var hook = el['on' + key];

      if (hook) {
        self[key] = function () {
          var args = Array.prototype.slice.call(arguments);
          self.debug(key, self._arguments);
          hook.apply(self, args.concat(self._arguments));
        };

        el['on' + hook] = null;
      }
    });

    if (el.onupdate) {
      this._update = el.onupdate;
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
   * Expose API for handling child instances on public renderer function
   */

  renderer.create = function create(key) {
    assert(key, 'Component instance key is required');
    assert(!component.cache[key], 'Key ' + key + ' already exist');
    component.cache[key] = new Component([name, key].join('-'));
    return component.cache[key];
  };

  renderer.get = function get(key) {
    return component.cache[key];
  };

  renderer.unset = function unset(key) {
    assert(component.cache[key], 'Cannot find ' + key + ' in ' + name);
    delete component.cache[key];
  };

  renderer.use = function use() {
    var key = Array.prototype.slice.call(arguments, 0, 1);
    var args = Array.prototype.slice.call(arguments, 1);
    var child = renderer.get(key);

    if (!child) {
      child = renderer.create(key);
    }

    return child.render.apply(child, args);
  };

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
