/* eslint-env es6 */

var html = require('bel')
var test = require('tape')
var component = require('../')

test('server side render', function (t) {
  t.test('render function required', function (t) {
    t.plan(2)
    t.throws(component, 'throws w/o arguments')
    t.throws(component.bind(undefined, 'name'), 'throws w/ only name')
  })

  t.test('render', function (t) {
    var render = component(greeting)

    t.plan(1)
    t.equal(
      render('world').toString(),
      greeting({}, 'world').toString(),
      'output match'
    )
  })

  t.test('mirror name', function (t) {
    var implicid = component(greeting)
    var explicid = component('greeting', greeting)

    t.equal(implicid.name, 'greeting', 'implicid name is mirrored')
    t.equal(explicid.name, 'greeting', 'explicid name is mirrored')
    t.end()
  })

  t.test('Context class in export', function (t) {
    t.plan(1)
    t.ok(typeof component.Context === 'function', 'Context in export')
  })

  t.test('context is first argument', function (t) {
    t.plan(1)
    var render = component(function (ctx, str) {
      t.ok(ctx instanceof component.Context, 'context is first argument')
      return greeting(ctx, str)
    })
    render('world')
  })

  t.test('render function is unbound', function (t) {
    t.plan(2)
    var strict = component(function (ctx, str) {
      'use strict'
      t.ok(typeof this === 'undefined', 'no calling context in strict mode')
      return greeting(ctx, str)
    })
    var nonstrict = component(function (ctx, str) {
      t.equal(this, global, 'global calling context in non-strict mode')
      return greeting(ctx, str)
    })
    strict('world')
    nonstrict('world')
  })

  t.test('can use plugin', function (t) {
    t.plan(7)
    var render = component(function (ctx, str) {
      t.ok(ctx.visited, 'context is forwarded')
      return greeting(ctx, str)
    })
    t.ok(typeof render.use === 'function', 'has use method')
    var value = render.use(function (ctx, str) {
      t.ok(ctx instanceof component.Context, 'context is first argument')
      t.equal(str, 'world', 'arguments are forwarded')
      ctx.visited = true
      return ctx
    })
    render.use(function (ctx) {
      'use strict'
      t.ok(typeof this === 'undefined', 'no calling context in strict mode')
      return ctx
    })
    render.use(function (ctx) {
      t.equal(this, global, 'global calling context in non-strict mode')
      return ctx
    })
    t.ok(typeof value === 'undefined', 'use returns nothing')
    render('world')
  })

  t.test('throws when plugin does not return', function (t) {
    t.plan(1)
    var render = component(greeting)
    render.use(function noop () {})
    t.throws(render.bind(undefined, 'world'), 'throws w/o context')
  })

  t.test('original render minnerethod in context', function (t) {
    t.plan(1)
    var render = component(greeting)
    render.use(function (ctx) {
      t.equal(ctx._render, greeting, 'ctx._render is same')
      return ctx
    })
    render('world')
  })
})

function greeting (ctx, name) {
  return html`
    <div>
      <h1>Hello ${name}!</h1>
    </div>
  `
}
