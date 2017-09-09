var nanologger = require('nanologger');
var Nanocomponent = require('nanocomponent');

/**
 * Lifecycle hooks for a statefull component.
 *
 * @param {any} props Function or Object
 * @param {string} props.name Component name, used for debugging
 * @param {boolean} props.cache Whether to save the element in-between mounts
 * @param {function} props.render Create element
 * @param {function} props.update Determine whether component should re-render
 * @param {function} props.load Called when component is mounted in DOM
 * @param {function} props.unload Called when component is removed from DOM
 * @param {function} props.beforerender Called before component is added to DOM
 * @param {function} props.afterupdate Called after update returns true
 * @param {function} props.afterreorder Called after component is reordered
 * @returns {function} Renders component
 *
 * @example
 * component(function user(user) {
 *   return html`<a href="/users/${ user._id }`>${ user.name }</a>`;
 * })
 *
 * @example
 * component({
 *   name: 'map',
 *   update(element, [coordinates], [prev]) {
 *     if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
 *       this.map.setCenter([coordinates.lng, coordinates.lat]);
 *     }
 *     return false;
 *   },
 *   load(element, coordinates) {
 *     this.map = new mapboxgl.Map({
 *       container: element,
 *       center: [coordinates.lng, coordinates.lat],
 *     });
 *   },
 *   unload() {
 *     this.map.destroy();
 *   },
 *   render(coordinates) {
 *     return html`<div class="Map"></div>`;
 *   }
 * })
 *
 * @example
 * function createComponent() {
 *   let isExpanded = false;
 *   const expander = { name: 'expander', render };
 *
 *   function toggle() {
 *     isExpanded = !isExpanded;
 *     expander.rerender();
 *   }
 *
 *   function render() {
 *     return html`
 *       <button onclick=${ toggle }>Expand</button>
 *       <p style="display: ${ isExpanded ? 'block' : 'none' };">
 *         Lorem ipsum dolor sit…
 *       </p>
 *     `;
 *   }
 *
 *   return component(expander);
 * }
 */

module.exports = function component(props) {
  var _element, _render;

  /**
   * Determine what to use for `createElement`
   */

  if (typeof props === 'function') {
    _render = props;
  } else if (typeof props === 'object' && props.render) {
    _render = props.render;
  } else {
    throw (new Error('Component must be provided with a render function'));
  }

  /**
   * Create a logger for internal usage
   */

  var log = nanologger(props.name);

  function Component() {
    Nanocomponent.call(this, props.name);

    log.debug('create');

    var self = this;

    // Expose `logger` on props
    props.log = log;

    // Expose `rerender` on props
    props.rerender = function () {
      self.rerender();
    };
  }

  /**
   * Extend Nanocomponent and proxy lifecycle methods with latest arguments
   */

  Component.prototype = Object.create(Nanocomponent.prototype);

  if (props.beforerender) {
    Component.prototype.beforerender = function (element) {
      props.beforerender.apply(props, [ element ].concat(this._arguments));
    };
  }

  if (props.afterupdate) {
    Component.prototype.afterupdate = function (element) {
      props.afterupdate.apply(props, [ element ].concat(this._arguments));
    };
  }

  if (props.afterreorder) {
    Component.prototype.afterreorder = function (element) {
      props.afterreorder.apply(props, [ element ].concat(this._arguments));
    };
  }

  Component.prototype.update = function () {
    var result;
    var args = Array.prototype.slice.call(arguments);

    if (props.update) {
      result = props.update.call(props, this.element, args, this._arguments);
    } else {
      result = diff(args, this._arguments);
    }

    if (result) {
      log.debug('update', args);
    }

    return result;
  };

  Component.prototype.createElement = function() {
    var args = Array.prototype.slice.call(arguments);

    if (props.cache && !this._loaded && _element) {
      if (props.update) {
        // Just try and update cached elements
        props.update.call(props, _element, args, this._arguments);
        if (this.afterupdate) {
          this.afterupdate(_element);
        }
      }
      return _element;
    } else if (!this.element) {
      log.debug('render', args);
    }

    return _render.apply(props, args);
  };

  Component.prototype.load = function(element) {
    _element = element;
    if (props.load) {
      props.load.apply(props, [ element ].concat(this._arguments));
    }
  };

  Component.prototype.unload = function() {
    if (!props.cache) {
      _element = null;
    }

    if (props.unload) {
      props.unload.apply(props, this._arguments);
    }
  };

  /**
   * Create an instance of the newly configured component
   */

  var component = new Component();

  /**
   * Create a middleman render method
   */

  var render = function () {
    var args = Array.prototype.slice.call(arguments);
    return component.render.apply(component, args);
  };

  /**
   * Overwrite function name with the original name
   */

  Object.defineProperty(render, 'name', { writable: true });
  render.name = props.name;

  /**
   * Expose just the wrapper function
   */

  return render;
};

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
