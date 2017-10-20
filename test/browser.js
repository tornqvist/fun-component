/* eslint-env es6 */

var html = require('bel')
var test = require('tape')
var component = require('../')
var cache = require('../cache')
var logger = require('../logger')
var restate = require('../restate')
var spawn = require('../spawn')

test('browser', function (t) {
  t.test('render', function (t) {
    var render = component(greeting)

    t.plan(1)
    t.equal(
      render('world').toString(),
      greeting({}, 'world').toString(),
      'output match'
    )
  })

  t.test('lifecycle methods', function (t) {
    var state = {
      load: 0,
      unload: 0,
      update: 0,
      beforerender: 0,
      afterupdate: 0
    }

    var render = component(function hooks (ctx, name) {
      return html`
        <div onupdate=${update} onbeforerender=${beforerender} onload=${load} onunload=${unload} onafterupdate=${afterupdate}>
          Hello ${name}!
        </div>
      `
    })

    var node = render('world')
    var container = createContainer(node)

    function load (ctx, str) {
      state.load += 1
      t.ok(ctx instanceof component.Context, 'context is first argument')
      t.equal(str, 'world', 'arguments forwarded to load')
    function load(ctx, str) {
      state.load += 1;
      t.ok(ctx instanceof component.Context, 'context is first argument');
      t.equal(str, 'world', 'arguments forwarded to load');
      render('Jane');
      render('Jane')
    }
    function unload (ctx, str) {
      state.unload += 1
      t.ok(ctx instanceof component.Context, 'context is first argument')
      t.equal(str, 'Jane', 'arguments forwarded to unload')
      t.deepEqual(state, {
        load: 1,
        unload: 1,
        update: 1,
        beforerender: 1,
        afterupdate: 1
      }, 'all lifecycle hooks fired')
      t.end()
    }
    function update (ctx, args, prev) {
      state.update += 1
      t.ok(ctx instanceof component.Context, 'context is first argument')
      t.equal(args[0], 'Jane', 'arguments forwarded to update')
      t.equal(prev[0], 'world', 'prev arguments forwarded to update')
      return true
    }
    function beforerender (ctx, str) {
      state.beforerender += 1
      t.ok(ctx instanceof component.Context, 'context is first argument')
      t.equal(str, 'world', 'arguments forwarded to beforerender')
    }
    function afterupdate (ctx, str) {
      state.afterupdate += 1
      t.ok(ctx instanceof component.Context, 'context is first argument')
      t.equal(str, 'Jane', 'arguments forwarded to afterupdate')
      window.requestAnimationFrame(function () {
        container.removeChild(node)
      })
    }
  })

  t.test('plugin: cache', function (t) {
    t.plan(6)
    var element
    var loaded = false
    var render = component(function (ctx, str) {
      if (!loaded) {
        t.ok(typeof ctx.cached === 'undefined', 'ctx.cached is unset')
      }

      var el = greeting(ctx, str)
      el.onload = function (ctx) {
        if (!loaded) {
          t.equal(ctx.cached, element, 'element is cached')
        }
        loaded = true
      }

      return el
    })

    render.use(cache())
    element = render('world')

    // Mount and await next frame
    var container = createContainer(element)
    window.requestAnimationFrame(function () {
      // Unmount and wait another frame
      container.removeChild(element)

      window.requestAnimationFrame(function () {
        // Render element from cache
        t.equal(element, render('again'), 'element is the same')

        // It should not have updated since it's not in the DOM atm
        t.notEqual(element.innerText, 'Hello again!', 'element did not update')

        // Mount yet again
        createContainer(element)
        window.requestAnimationFrame(function () {
          // Issue an update with new arguments
          t.ok(render('again').isSameNode(element), 'proxy node was returned')

          // It should have been updated now that it is in the DOM
          t.equal(element.innerText, 'Hello again!', 'element did update')
        })
      })
    })
  })

  t.test('plugin: logger', function (t) {
    t.plan(2)
    var render = component(greeting)
    render.use(logger())
    render.use(function (ctx) {
      ctx.log._print = function (level) {
        t.equal(level, 'debug', 'debug on ' + (ctx.element ? 'update' : 'render'))
      }
      return ctx
    })
    createContainer(render('world'))
    render('again')
  })

  t.test('plugin: restate', function (t) {
    t.plan(4)
    var render = component(function (ctx) {
      var element = greeting(ctx, ctx.state.name)
      element.onload = onload
      return element
    })

    render.use(restate({ name: 'world' }))
    var element = render()
    t.equal(element.innerText, 'Hello world!', 'initial state applied')

    createContainer(element)
    window.requestAnimationFrame(function () {
      t.equal(element.innerText, 'Hello again!', 'state updated')
    })

    function onload (ctx) {
      t.ok(typeof ctx.state === 'object', 'state in context')
      t.ok(typeof ctx.restate === 'function', 'restate in context')
      ctx.restate({ name: 'again' })
    }
  })

  t.test('plugin: spawn', function (t) {
    t.plan(4)
    var cache = {}
    var render = component(function (ctx, id) {
      var element = greeting(ctx, id)
      element.onload = function (ctx, id) {
        if (cache[id]) {
          t.notEqual(ctx._ncID, cache[id], 'spawn ' + id + ' was discarded')
        }
        cache[id] = ctx._ncID
      }
      return element
    })

    t.throws(spawn, 'identity fn is required')
    render.use(spawn(function (id) { return id }))
    var one = render('one')
    var two = render('two')
    var container = createContainer()

    container.appendChild(one)
    container.appendChild(two)
    window.requestAnimationFrame(function () {
      t.notEqual(cache.one, cache.two, 'two contexts spawned')
      container.removeChild(one)
      container.removeChild(two)

      window.requestAnimationFrame(function () {
        container.appendChild(render('one'))
        container.appendChild(render('two'))
      })
    })
  })
})

function greeting (ctx, name) {
  return html`
    <div>
      <h1>Hello ${name}!</h1>
    </div>
  `
}

function makeID () {
  return 'containerid-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}

function createContainer (child) {
  var container = document.createElement('div')
  container.id = makeID()
  document.body.appendChild(container)
  if (child) {
    container.appendChild(child)
  }
  return container
}
