# fun-component [![stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

[![npm version](https://img.shields.io/npm/v/fun-component.svg?)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)

A pure functional approach to authoring performant HTML components using plugins to extend functionality. Syntactic suggar on top of [nanocomponent](https://github.com/choojs/nanocomponent). Pass in a function and get another function back that handles rerendering as needed when called upon.

- [Usage](#usage)
- [API](#api)
  - [Context](#context)
  - [Lifecycle](#lifecycle)
  - [Plugins](#plugins)
- [Examples](#examples)
- [Why tho?](#why-tho)

## Usage

The most straightforward use is to pass in a function and have the default shallow diff figure out whether to rerender the component on consecutive calls.

```javascript
// button.js
const html = require('bel')
const component = require('fun-component')

module.exports = component(function button(ctx, clicks, onclick) {
  return html`
    <button onclick=${ onclick }>
      Clicked ${ clicks } times
    </button>
  `
})
```

```javascript
// app.js
const choo = require('choo')
const button = require('./button')

const app = choo()
app.route('/', view)
app.mount('body')

function view(state, emit) {
  return html`
    <body>
      ${ button(state.clicks, () => emit('click')) }
    </body>
  `
}

app.use(function (state, emitter) {
  state.clicks = 0
  emitter.on('click', () => {
    state.clicks += 1
    emitter.emit(state.events.RENDER)
  })
})
```

## API

### `component(render<function>)`
### `component(name<string>, render<function>)`

Create a new component context. Either takes a function as an only argument or a name and a function. Returns a function that renders the element. If no name is supplied the name is derrived from the functions `name` property.

*Warning: implicit function names are most probably mangled during minification. If name consistency is important to your implementation, use the explicit name syntax.*

```javascript
component('hello', () => html`<h1>Hi there!</h1>`)
```

### Context

The component context (`ctx`) is prefixed to the arguments of all lifecycle hooks and the render function itself. The context object can be used to access the underlying nanocomponent instance.

```javascript
// Exposing nanocomponent inner workings
component(function echo(ctx) {
  return html`<h1>I'm ${ ctx._name } on the ${ ctx._hasWindow ? 'client' : 'server' }</h1>`
})
```

### Lifecycle

All the lifecycle hooks of nanocomponent are supported, i.e. [`beforerender`](https://github.com/choojs/nanocomponent#nanocomponentprototypebeforerenderel), [`load`](https://github.com/choojs/nanocomponent#nanocomponentprototypeloadel), [`unload`](https://github.com/choojs/nanocomponent#nanocomponentprototypeunloadel), [`afterupdate`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterupdateel), and [`afterreorder`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterreorderel). Lifecycle hooks are declared on the element itself (with an "on" prefix) and are forwarded to the underlying nanocomponent instance.

All lifecycle hooks are called with the context object and the latest arguments used to call the component.

#### Update

fun-component comes with a baked in default update function that performs a shallow diff of arguments to determine whether to update the component. Setting `onupdate` on the element overrides this default behavior.

##### `onupdate(ctx<object>, args<array>, prev<array>)`

Opposed to how nanocomponent calls the update function to detemrine whether to rerender the component, fun-component not only supplies the next arguments but also the previous arguments. These two can then be compared to determine whether to update.

*Tip: Using ES2015 deconstruction makes this a breeze.*

```javascript
component(function greeting(ctx, title) {
  return html`<h1 onupdate=${ update }>Hello ${ title }!</h1>`
})

// Deconstruct arguments and compare `title`
function update(ctx, [next], [prev]) {
  return next !== prev
}
```

#### Example

Using every lifecycle hook available. The rendered element can be accessed on the context object as `ctx.element`.

```javascript
component(function hooks(ctx, title) {
  return html`
    <div onupdate=${ update } onbeforerender=${ beforerender } onload=${ load } onunload=${ unload } onafterupdate=${ afterupdate } onafterreorder=${ afterreorder }>
      Hello ${ title }!
    </div>
  `
})

function update(ctx, [title], [prev]) {
  console.log(`diffing ${ title } and ${ prev }`)
  return title !== prev
}

function beforerender(ctx, title) {
  console.log(`will render with ${ title }`)
}

function load(ctx, title) {
  console.log(ctx.element, `mounted in DOM with ${ title }`)
}

function unload(ctx, title) {
  console.log(ctx.element, `removed from DOM with ${ title }`)
}

function afterupdate(ctx, title) {
  console.log(`updated with ${ title }`)
}

function afterreorder(ctx, title) {
  console.log(`reordered with ${ title }`)
}
```

### Plugins

Plugins are middlware functions that are called just before the component is rendered or updated. A plugin can inspect the arguments, modify the context object or even return another context object that is to be used for rendering the component.

```javascript
const html = require('bel')
const component = require('fun-component')

const greeter = component(function greeting(ctx, title) {
  return html`<h1>Hello ${ title }!</h1>`
})

greeter.use(log)

document.body.appendChild(greeter('world'))

function log(ctx, title) {
  console.log(`Rendering ${ ctx._ncID } with ${ title }`)
  return ctx
}
```

fun-component is bundled with with a handfull of plugins that cover the most common scenarios. Have you written a plugin you want featured in this list? Fork, add, and make a pull request!

- [spawn](spawn) – Spawn component contexts on demand and discard on unload.
- [restate](restate) – Add state object and state management to the context object.
- [logger](logger) – Add a logger (using [nanologger](https://github.com/choojs/nanologger)) to the context object.
- [cache](cache) – Cache element and reuse on consecutive mounts.

## Examples

For example implementations, see [/examples](/examples). Either spin them up locally or visit the link.

- Mapbox (using [cache](cache))
  - `npm run example:mapbox`
  - https://fun-component-mapbox.now.sh
- List (creating instances with `use`)
  - `npm run example:list`
  - https://fun-component-list.now.sh

## Why tho?

Authoring a component should be as easy as writing a function. Using arguments and scope to handle state is both implicit and transparent. Worrying about calling context, and stashing things on `this` makes for cognitive overhead.

Not for you? If object oriented programming is your thing, use [nanocomponent](https://github.com/choojs/nanocomponent). If you're more into events, maybe [microcomponent](https://github.com/yoshuawuyts/microcomponent) is a good fit.

## See Also

- [yoshuawuyts/microcomponent](https://github.com/yoshuawuyts/microcomponent)
- [jongacnik/component-box](https://github.com/jongacnik/component-box)
- [choojs/nanocomponent](https://github.com/choojs/nanocomponent)
- [choojs/choo](https://github.com/choojs/choo)
- [shama/bel](https://github.com/shama/bel)

## License

[MIT](https://tldrlegal.com/license/mit-license)
