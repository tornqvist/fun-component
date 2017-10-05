/* eslint-env es6 */

var html = require('bel');
var test = require('tape');
var component = require('../');

test('browser', function (t) {
  t.test('render', function (t) {
    var render = component(greeting);

    t.plan(1);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'output match'
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

    var self;
    var render = component(function hooks(name) {
      self = this;
      return html`
        <div onupdate=${ update } onbeforerender=${ beforerender } onload=${ load } onunload=${ unload } onafterupdate=${ afterupdate }>
          Hello ${ name }!
        </div>
      `;
    });

    var node = render('world');
    var container = createContainer(node);

    function load(element, str) {
      state.load += 1;
      t.equal(self, this, 'context is same');
      t.equal(element, node, 'load recived element');
      t.equal(str, 'world', 'arguments forwarded to load');
      render('Jane');
    }
    function unload(element, str) {
      state.unload += 1;
      t.equal(self, this, 'context is same');
      t.equal(element, node, 'unload recived element');
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
      t.equal(self, this, 'context is same');
      t.equal(element, node, 'update recived element');
      t.equal(args[0], 'Jane', 'arguments forwarded to update');
      t.equal(prev[0], 'world', 'prev arguments forwarded to update');
      return true;
    }
    function beforerender(element, str) {
      state.beforerender += 1;
      t.equal(self, this, 'context is same');
      t.ok(element instanceof HTMLElement, 'beforerender recived (an) element');
      t.equal(str, 'world', 'arguments forwarded to beforerender');
    }
    function afterupdate(element, str) {
      state.afterupdate += 1;
      t.equal(self, this, 'context is same');
      t.equal(element, node, 'afterupdate recived element');
      t.equal(str, 'Jane', 'arguments forwarded to afterupdate');
      requestAnimationFrame(() => container.removeChild(node));
    }
  });

  t.test('child instances', function (t) {
    var self;
    var parent = component(function parent() {
      self = self || this;
      return html`<div id="${ this._name }"></div>`;
    });

    t.throws(parent.create, 'throws w/o key');

    var child = parent.create('child');

    t.throws(parent.create.bind(parent, 'child'), 'throws w/ existing key');
    t.equal(parent.name, 'parent', 'function name intact');
    t.equal(child._name, 'parent_child', 'instance name extended');
    t.equal(child, parent.get('child'), 'got child');
    t.equal(typeof parent.get('nope'), 'undefined', 'child does not exist');

    var node1 = parent();
    var node2 = child.render();
    var container = createContainer(node1);
    container.appendChild(node2);

    t.equal(self, parent.get(), 'no argument returns self');
    t.false(node1.isSameNode(node2), 'different node created');
    t.true(parent.use('child').isSameNode(node2), 'use renders child');

    parent.delete('child');
    t.equal(typeof parent.get('child'), 'undefined', 'child does not exist');
    t.throws(parent.delete, 'throws w/o key');
    t.throws(parent.delete.bind(parent, 'child'), 'throws w/ unknown key');

    t.true(parent.use('child') instanceof Element, 'use creates child');
    t.end();
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
