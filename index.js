var morph = require('nanomorph');
var nanologger = require('nanologger');
var Nanocomponent = require('nanocomponent');

/**
 * Lifecycle hooks for a statefull component.
 *
 * @param {any} props Function or Object.
 * @param {string} props.name Component name, used for debugging.
 * @param {boolean} props.cache Whether to save the element in-between mounts.
 * @param {function} props.render Create element.
 * @param {function} props.update Modify component on consecutive calls. Return whether component should re-render.
 * @param {function} props.load Called when component is mounted in the DOM.
 * @param {function} props.unload Called when component is removed from the DOM.
 * @returns {function} Renders component.
 *
 * @example
 * component(function user(user) {
 *   return html`<a href="/users/${ user._id }`>${ user.name }</a>`;
 * })
 *
 * @example
 * component({
 *   name: 'map',
 *   update(element, coordinates, emit) {
 *     if (coordinates.lng !== prevCoordinates.lng || coordinates.lat !== prevCoordinates.lat) {
 *       this.map.setCenter([coordinates.lng, coordinates.lat]);
 *     }
 *     return false;
 *   },
 *   load(element, coordinates, emit) {
 *     this.map = new mapboxgl.Map({
 *       container: element,
 *       center: [coordinates.lng, coordinates.lat],
 *     });
 *   },
 *   unload() {
 *     this.map.destroy();
 *   },
 *   render(coordinates, emit) {
 *     return html`<div class="Map"></div>`;
 *   }
 * })
 */

module.exports = function component(props) {
  var _args, _element, _render, _update;

  if (typeof props === 'function') {
    _render = props;
  } else if (typeof props === 'object' && props.render) {
    _render = props.render;
    _update = props.update;
  } else {
    throw (new Error('Component must be provided with a render function'));
  }

  function Component() {
    Nanocomponent.call(this);
    this.log = nanologger(props.name);
    this.log.debug('create');

    var self = this;

    // Expose debug logger on props
    props.debug = function () {
      self.log.debug.apply(self.log, Array.prototype.slice.call(arguments));
    };

    // Overwrite (or add) update method to props
    props.update = function () {
      return self.update.apply(self, Array.prototype.slice.call(arguments));
    };

    // Overwrite render with a force morph wrapper for internal use
    props.render = function render() {
      var args = Array.prototype.slice.call(arguments);

      if (self._hasWindow && _element) {
        self.log.debug('render', args);
        morph(_element, self._handleRender(args));
      } else {
        return self.render.apply(self, args);
      }
    };

    Object.defineProperty(props, 'id', {
      get: function () { return this._id; }
    });
  }

  Component.prototype = Object.create(Nanocomponent.prototype);

  Component.prototype.update = function () {
    var value;
    var args = Array.prototype.slice.call(arguments);

    if (_update) {
      value = _update.call(props, _element, args, _args);
    } else {
      value = shouldUpdate(args, _args);
    }

    if (value) {
      this.log.debug('update', args);
    }

    // Save reference to latest set of arguments used to render
    _args = args;

    return value;
  };

  Component.prototype.createElement = function() {
    var args = Array.prototype.slice.call(arguments);

    if (props.cache && !this._loaded && _element) {
      if (_update) {
        _update.call(props, _element, args, _args);
      }

      return _element;
    } else if (!this.element) {
      this.log.debug('render', args);
    }

    // Save reference to latest set of arguments used to render
    _args = args;

    return _render.apply(props, args);
  };

  Component.prototype.load = function() {
    _element = this.element;
    if (props.load) {
      props.load.apply(props, [ _element ].concat(_args));
    }
  };

  Component.prototype.unload = function() {
    if (!props.cache) {
      _element = null;
    }

    if (props.unload) {
      props.unload.apply(props, _args);
    }
  };

  var instance = new Component();
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return instance.render.apply(instance, args);
  };
};

function shouldUpdate(args, prev) {
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
