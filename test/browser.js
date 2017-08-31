var html = require('bel');
var tape = require('tape');
var component = require('../');

tape('browser', function (assert) {
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

  test('load', function (t) {
    var render = component({
      load(element, name) {
        t.ok(element instanceof window.HTMLElement, 'recived element');
        t.equal(name, 'world', 'recived argument');
        requestAnimationFrame(cleanup);
      },
      render: greeting
    });

    t.plan(2);

    document.body.appendChild(render('world'));
  });

  test('unload', function (t) {
    var render = component({
      unload(name) {
        t.equal(name, 'world', 'recived argument');
      },
      render: greeting
    });

    t.plan(1);

    var element = render('world');
    document.body.appendChild(element);
    requestAnimationFrame(function () {
      element.parentElement.removeChild(element);
      requestAnimationFrame(cleanup);
    });
  });

  test('cache', function (t) {
    var render = component({
      cache: true,
      render: greeting
    });

    t.plan(1);

    var element = render('world');
    document.body.appendChild(element);
    requestAnimationFrame(function () {
      element.firstElementChild.innerHTML = 'Hello Jane!';
      requestAnimationFrame(function () {
        document.body.removeChild(element);
        requestAnimationFrame(function () {
          document.body.appendChild(render('Jane'));
          t.equal(
            element,
            document.body.firstElementChild,
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
  });
});

function greeting(name) {
  return html`
    <div>
      <h1>Hello ${ name }!</h1>
    </div>
  `;
}

function cleanup() {
  document.body.innerHTML = '';
}
