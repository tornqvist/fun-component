const html = require('bel');
const test = require('tape');
const component = require('../');

test('server side render', t => {
  t.test('render', t => {
    const render = component(greeting);

    t.plan(1);
    t.equal(
      render('world').toString(),
      greeting('world').toString(),
      'output match'
    );
  });

  t.test('ignore cache', t => {
    const render = component({
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

  t.test('mirror name', t => {
    const asProps = component({ name: 'props', render: greeting });
    const asFn = component(function fn(args) {
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
