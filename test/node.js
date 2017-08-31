var html = require('bel');
var tape = require('tape');
var component = require('../');

tape('server side render', function (assert) {
  var test = assert.test;

  test('render', function (t) {
    var render = component(greeting);

    t.plan(1);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'output match'
    );
  });

  test('ignore cache', function (t) {
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

  test('ignore update', function (t) {
    var render = component({
      update: function () {
        return false;
      },
      render: greeting
    });

    t.plan(2);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'first time render'
    );
    t.equal(
      render('space').toString(),
      greeting('space').toString(),
      'subsequent render'
    );
  });
});

function greeting(name) {
  return html`
    <div>
      <h1>Hello ${ name }!</h1>
    </div>
  `;
}
