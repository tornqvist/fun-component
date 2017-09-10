/* eslint-env es6 */

var html = require('bel');
var test = require('tape');
var component = require('../');

test('server side render', function (t) {
  t.test('render', function (t) {
    var render = component(greeting);

    t.plan(1);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'output match'
    );
  });

  t.test('ignore cache', function (t) {
    var render = component({
      cache: true,
      render: greeting
    });

    t.plan(2);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'output match'
    );
    t.equal(
      render('space').toString(),
      greeting('space').toString(),
      'output changed'
    );
  });

  t.test('mirror name', function (t) {
    var asProps = component({ name: 'props', render: greeting });
    var asFn = component(function fn(args) {
      return greeting.apply(this, args);
    });

    t.plan(2);
    t.equal(asProps.name, 'props', 'props.name is mirrored');
    t.equal(asFn.name, 'fn', 'fn.name is mirrored');
  });
});

function greeting(name) {
  return html`
    <div>
      <h1>Hello ${ name }!</h1>
    </div>
  `;
}
