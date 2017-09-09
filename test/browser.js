const html = require('bel');
const test = require('tape');
const component = require('../');

test('browser', t => {
  t.test('render', t => {
    const asFn = component(greeting);
    const asProps = component({ render: greeting });

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

  t.test('lifecycle methods', t => {
    const state = {
      load: 0,
      unload: 0,
      update: 0,
      beforerender: 0,
      afterupdate: 0
    };
    const render = component({
      load,
      unload,
      update,
      beforerender,
      afterupdate,
      render: greeting
    });

    const node = render('world');
    const container = createContainer(node);

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
    function update(element, [str], [prev]) {
      state.update += 1;
      t.equal(element, node, 'update recived element');
      t.equal(str, 'Jane', 'arguments forwarded to update');
      t.equal(prev, 'world', 'prev arguments forwarded to update');
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
      container.removeChild(node);
    }
  });

  t.test('cache', t => {
    let count = 0;
    const render = component({
      cache: true,
      update(element) {
        element.firstElementChild.innerHTML = 'Hello Jane!';
        return false;
      },
      render() {
        count += 1;
        if (count > 1) { t.fail('render called twice'); }
        return greeting.apply(this, arguments);
      }
    });

    t.plan(2);

    const element = render('world');
    const container = createContainer(element);
    requestAnimationFrame(() => {
      container.removeChild(element);
      requestAnimationFrame(() => {
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

  t.test('rerender exposed on self', t => {
    const props = { render: greeting };

    component(props);

    t.plan(1);
    t.equal(typeof props.rerender, 'function', 'rerender attached to props');
  });

  t.test('log methods exposed on self', t => {
    const methods = [ 'trace', 'debug', 'info', 'warn', 'error', 'fatal' ];
    const props = { render };

    t.plan(methods.length + 1);

    component(props)('world');

    function render() {
      t.equal(typeof this.log, 'object', 'has log object on self');
      methods.map(key => {
        t.equal(
          typeof this.log[key],
          'function',
          `${ key } attached to self.log`
        );
      });
      return greeting.apply(this, arguments);
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
  const container = document.createElement('div');
  container.id = makeID();
  document.body.appendChild(container);
  if (child) {
    container.appendChild(child);
  }
  return container;
}
