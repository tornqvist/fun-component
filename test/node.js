/* eslint-env es6 */

var html = require('bel');
var test = require('tape');
var component = require('../');

test('server side render', function (t) {
  t.test('render function required', function (t) {
    t.plan(2);
    t.throws(component, 'throws w/o arguments');
    t.throws(component.bind(this, 'name'), 'throws w/ only name');
  });

  t.test('render', function (t) {
    var render = component(greeting);

    t.plan(1);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'output match'
    );
  });

  t.test('mirror name', function (t) {
    var implicid = component(greeting);
    var explicid = component('greeting', greeting);

    function noop() {}
    noop.displayName = 'trolol';
    var displayName = component(noop);

    t.equal(implicid.name, 'greeting', 'implicid name is mirrored');
    t.equal(implicid.displayName, 'greeting', 'implicid name map to displayName');
    t.equal(explicid.name, 'greeting', 'explicid name is mirrored');
    t.equal(explicid.displayName, 'greeting', 'explicid name map to displayName');
    t.equal(displayName.displayName, 'trolol', 'displayName is mirrored');
    t.equal(displayName.name, 'trolol', 'displayName map to name');
    t.end();
  });

  t.test('nanocomponent in calling context', function (t) {
    t.plan(1);
    var render = component(function () {
      t.notEqual(typeof this._ncID, 'undefined', 'has nanocomponent id');
    });
    render();
  });

  t.test('nanologger in calling context', function (t) {
    t.plan(1);
    var render = component(function () {
      t.ok(this._logLevel, 'has nanologger logLevel');
    });
    render();
  });
});

function greeting(name) {
  return html`
    <div>
      <h1>Hello ${ name }!</h1>
    </div>
  `;
}
