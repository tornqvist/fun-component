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

  t.test('default update diff', function (t) {
    t.plan(2)

    var render = component(greeting)
    render.on('afterupdate', function (ctx, name, callback) {
      callback()
    })

    var next
    var element = render('world')
    createContainer(element)
    function fn () { next() }

    next = function () { t.pass('extra argument update') }
    render('world', fn)
    next = function () { t.pass('different argument update') }
    render('again', fn)
    next = function () {}
    var proxy = render('world', fn, element)
    next = function () { t.fail('proxy and element should be same') }
    render('world', fn, proxy)
  })

  t.test('lifecycle events', function (t) {
    var state = {
      load: 0,
      unload: 0,
      update: 0,
      beforerender: 0,
      afterupdate: 0
    }

    var render = component(greeting)
    render.on('update', update)
    render.on('beforerender', beforerender)
    render.on('load', load)
    render.on('unload', unload)
    render.on('afterupdate', afterupdate)

    var node = render('world')
    var container = createContainer(node)

    function load (ctx, str) {
      state.load += 1
      t.ok(ctx instanceof component.Context, 'load: context is first argument')
      t.equal(str, 'world', 'load: arguments are forwarded')
      render('Jane')
    }
    function unload (ctx, str) {
      state.unload += 1
      t.ok(ctx instanceof component.Context, 'unload: context is first argument')
      t.equal(str, 'Jane', 'unload: arguments are forwarded')
      t.deepEqual(state, {
        load: 1,
        unload: 1,
        update: 1,
        beforerender: 1,
        afterupdate: 1
      }, 'all lifecycle events fired')
      t.end()
    }
    function update (ctx, args, prev) {
      state.update += 1
      t.ok(ctx instanceof component.Context, 'update: context is first argument')
      t.equal(args[0], 'Jane', 'update: arguments are forwarded')
      t.equal(prev[0], 'world', 'update: prev arguments are forwarded')
      return true
    }
    function beforerender (ctx, element, str) {
      state.beforerender += 1
      t.ok(ctx instanceof component.Context, 'beforerender: context is first argument')
      t.ok(element instanceof window.HTMLElement, 'beforerender: element is forwarded')
      t.equal(str, 'world', 'beforerender: arguments are forwarded')
    }
    function afterupdate (ctx, str) {
      state.afterupdate += 1
      t.ok(ctx instanceof component.Context, 'afterupdate: context is first argument')
      t.equal(str, 'Jane', 'afterupdate: arguments are forwarded')
      window.requestAnimationFrame(function () {
        container.removeChild(node)
      })
    }
  })

  t.test('can have multiple event listeners', function (t) {
    t.plan(2)
    var times = 0
    var render = component(greeting)
    render.on('load', onload)
    render.on('load', onload)
    createContainer(render('world'))
    function onload (ctx, str) {
      times += 1
      t.pass('load event #' + times)
    }
  })

  t.test('multiple update listeners', function (t) {
    t.plan(1)
    var render = component(greeting)

    // update if any update listener return true
    render.on('update', Boolean.bind(undefined, false))
    render.on('update', Boolean.bind(undefined, true))
    render.on('update', Boolean.bind(undefined, false))

    render.on('afterupdate', t.pass.bind(t, 'did update'))
    createContainer(render('world'))
    render('again')
  })

  t.test('remove lifecycle event listener', function (t) {
    var times = 0
    var render = component(greeting)
    render.on('update', onupdate)
    render.on('afterupdate', function () {
      times += 1
    })
    createContainer(render('world'))
    render('world')
    window.requestAnimationFrame(function () {
      render.off('update', onupdate)
      render('world')
      t.equal(times, 1, 'should only update once')
      t.end()
    })
    function onupdate () {
      return true
    }
  })

  t.test('fork can override name', function (t) {
    t.plan(2)
    var first = component('first', greeting)
    var second = first.fork('second')
    first.on('beforerender', function (ctx) {
      t.equal(ctx._name, 'first', 'name is unchanged on base')
    })
    second.on('beforerender', function (ctx) {
      t.equal(ctx._name, 'second', 'name is changed on fork')
    })
    first()
    second()
  })

  t.test('fork produce different nodes', function (t) {
    t.plan(1)
    var first = component(greeting)
    var second = first.fork()
    var container = createContainer(first())
    container.appendChild(second())
    t.equal(container.childElementCount, 2, 'two elements mounted')
  })

  t.test('plugin: cache', function (t) {
    t.plan(6)
    var element
    var loaded = false
    var render = component(function (ctx, str) {
      if (!loaded) t.ok(typeof ctx.cached === 'undefined', 'ctx.cached is unset')
      return greeting(ctx, str)
    })

    render.use(cache())
    render.on('load', function (ctx) {
      if (!loaded) t.equal(ctx.cached, element, 'element is cached')
      loaded = true
    })
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
    t.plan(6)
    var render = component(greeting)
    render.use(logger())
    render.use(function (ctx) {
      ctx.log._print = function (level, type) {
        t.equal(level, 'debug', `debug on ${type}`)
      }
    })
    var element = render('world')
    var container = createContainer(element)
    window.requestAnimationFrame(function () {
      render('again')
      container.removeChild(element)
    })
  })

  t.test('plugin: restate', function (t) {
    t.plan(4)
    var render = component(function (ctx) {
      return greeting(ctx, ctx.state.name)
    })

    render.use(restate({ name: 'world' }))
    render.on('load', onload)
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
    var render = component(greeting)

    t.throws(spawn, 'identity fn is required')
    render.use(spawn(function (id) { return id }))
    render.on('load', function (ctx, id) {
      if (cache[id]) t.notEqual(ctx._ncID, cache[id], `spawn ${id} was discarded`)
      cache[id] = ctx._ncID
    })

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
