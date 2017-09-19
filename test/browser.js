/* eslint-env es6 */

var html = require('bel');
var test = require('tape');
var component = require('../');

test('browser', function (t) {
  t.test('render', function (t) {
    var asFn = component(greeting);
    var asProps = component({ render: greeting });

    t.plan(2);
    t.equal(
      asFn('world').toString(),
      greeting('world').toString(),
      'as function'
    );
    t.equal(
      asProps('world').toString(),
      greeting('world').toString(),
      'as object'
    );
  });

  t.test('lifecycle methods', function (t) {
    var state = {
      load: 0,
      unload: 0,
      update: 0,
      beforerender: 0,
      afterupdate: 0
    };
    var render = component({
      load: load,
      unload: unload,
      update: update,
      beforerender: beforerender,
      afterupdate: afterupdate,
      render: greeting
    });

    var node = render('world');
    var container = createContainer(node);

    function load(element, str) {
      state.load += 1;
      t.equal(element, node, 'load recived element');
      t.equal(str, 'world', 'arguments forwarded to load');
      render('Jane');
    }
    function unload(str) {
      state.unload += 1;
      t.equal(str, 'Jane', 'arguments forwarded to unload');
      t.deepEqual(state, {
        load: 1,
        unload: 1,
        update: 1,
        beforerender: 1,
        afterupdate: 1
      }, 'all lifecycle hooks fired');
      t.end();
    }
    function update(element, args, prev) {
      state.update += 1;
      t.equal(element, node, 'update recived element');
      t.equal(args[0], 'Jane', 'arguments forwarded to update');
      t.equal(prev[0], 'world', 'prev arguments forwarded to update');
      return true;
    }
    function beforerender(element, str) {
      state.beforerender += 1;
      t.ok(element instanceof HTMLElement, 'beforerender recived (an) element');
      t.equal(str, 'world', 'arguments forwarded to beforerender');
    }
    function afterupdate(element, str) {
      state.afterupdate += 1;
      t.equal(element, node, 'afterupdate recived element');
      t.equal(str, 'Jane', 'arguments forwarded to afterupdate');
      requestAnimationFrame(() => container.removeChild(node));
    }
  });

  t.test('cache', function (t) {
    var count = 0;
    var render = component({
      cache: true,
      update: function (element) {
        element.firstElementChild.innerHTML = 'Hello Jane!';
        return false;
      },
      render: function() {
        count += 1;
        if (count > 1) { t.fail('render called twice'); }
        return greeting.apply(this, arguments);
      }
    });

    t.plan(2);

    var element = render('world');
    var container = createContainer(element);
    requestAnimationFrame(function () {
      container.removeChild(element);
      requestAnimationFrame(function () {
        container.appendChild(render('Jane'));
        t.equal(
          element,
          container.firstElementChild,
          'element is preserved in-between mounts'
        );
        t.equal(
          element.innerText,
          'Hello Jane!',
          'element was updated'
        );
      });
    });
  });

  t.test('rerender exposed on self', function (t) {
    var props = { render: greeting };

    component(props);

    t.plan(1);
    t.equal(typeof props.rerender, 'function', 'rerender attached to props');
  });

  t.test('log methods exposed on self', function (t) {
    var methods = [ 'trace', 'debug', 'info', 'warn', 'error', 'fatal' ];
    var props = { render: render };

    t.plan(methods.length + 1);

    component(props)('world');

    function render() {
      var self = this;
      t.equal(typeof self.log, 'object', 'has log object on self');
      methods.map(function (key) {
        t.equal(
          typeof self.log[key],
          'function',
          key + ' attached to self.log'
        );
      });
      return greeting.apply(self, arguments);
    }
  });
});

function greeting(name) {
  return html`
    <div>
      <h1>Hello ${ name }!</h1>
    </div>
  `;
}

function makeID() {
  return 'containerid-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function createContainer(child) {
  var container = document.createElement('div');
  container.id = makeID();
  document.body.appendChild(container);
  if (child) {
    container.appendChild(child);
  }
  return container;
}
