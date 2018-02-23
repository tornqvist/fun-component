<div align="center">

# fun-component `<☺/>`

[![npm version](https://img.shields.io/npm/v/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)
[![style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://npmjs.org/package/fun-component)

</div>

A functional approach to authoring performant HTML components using plugins. Pass in a function and get another function back that handles rerendering as needed when called upon. Syntactic suggar on top of [nanocomponent](https://github.com/choojs/nanocomponent).

- [Usage](#usage)
- [API](#api)
  - [Lifecycle events](#lifecycle-events)
  - [Plugins](#plugins)
  - [Composition and forking](#composition-and-forking)
- [Examples](#examples)
- [Why tho?](#why-tho)

## Usage

The most straightforward use is to pass in a function and have the default shallow diff figure out whether to rerender the component on consecutive calls.

```javascript
// button.js
var html = require('bel')
var component = require('fun-component')

module.exports = component(function button (ctx, clicks, onclick) {
  return html`
    <button onclick=${onclick}>
      Clicked ${clicks} times
    </button>
  `
})
```

```javascript
// app.js
var choo = require('choo')
var html = require('choo/html')
var button = require('./button')

var app = choo()
app.route('/', view)
app.mount('body')

function view (state, emit) {
  return html`
    <body>
      ${button(state.clicks, () => emit('click'))}
    </body>
  `
}

app.use(function (state, emitter) {
  state.clicks = 0
  emitter.on('click', function () {
    state.clicks += 1
    emitter.emit('render')
  })
})
```

### Standalone

Though fun-component was authored with [choo](https://github.com/choojs/choo) in mind it works just as well standalone!

```javascript
const button = require('./button')

let clicks = 0
function onclick () {
  clicks += 1
  button(clicks, onclick)
}

document.body.appendChild(button(clicks, onclick))
```

## API

### `component([name], render)`

Create a new component context. Either takes a function as an only argument or a name and a function. Returns a function that renders the element. If no name is supplied the name is derrived from the functions `name` property.

*Warning: implicit function names are most probably mangled during minification. If name consistency is important to your implementation, use the explicit name syntax.*

```javascript
var render = component('hello', () => html`<h1>Hi there!</h1>`)
```

#### `render.on(name, fn)`

Add lifecycle event listener, see [Lifecycle events](#lifecycle-events).

#### `render.off(name, fn)`

Remove lifecycle eventlistener, see [Lifecycle events](#lifecycle-events).

#### `render.use(fn)`

Add plugin, see [Plugins](#plugins).

#### `render.fork()`

Create a new component context inheriting listeners and plugins, see [Composition and forking](#composition-and-forking)

### Lifecycle events

All the lifecycle hooks of nanocomponent are supported, i.e. [`beforerender`](https://github.com/choojs/nanocomponent#nanocomponentprototypebeforerenderel), [`load`](https://github.com/choojs/nanocomponent#nanocomponentprototypeloadel), [`unload`](https://github.com/choojs/nanocomponent#nanocomponentprototypeunloadel), [`afterupdate`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterupdateel), and [`afterreorder`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterreorderel). You can listen for lifecycle events using the `on` method, and remove them with the `off` method. Any number of listeners can be added for an event. The arguments to lifecycle event listeners always prefixed with the component context and the element, followed by the last render arguments.

```javascript
var html = require('bel')
var component = require('fun-component')

var greeting = component(function greeting (ctx, name) {
  console.log(`render with "${name}"`)
  return html`<h1>Hello ${name}!</h1>`
})

greeting.on('afterupdate', afterupdate)

function afterupdate (ctx, el, name) {
  console.log(`updated with "${name}"`)
  greeting.off(afterupdate)
}

greeting('world') // -> logs: render with "world"
greeting('planet') // -> logs: updated with "planet"
greeting('tellus')
```

#### Context

The component context (`ctx`) is prefixed to the arguments of all lifecycle events and the render function itself. The context object can be used to access the underlying [nanocomponent](https://github.com/choojs/nanocomponent) instance.

```javascript
var html = require('bel')
var component = require('fun-component')

// exposing nanocomponent inner workings
module.exports = component(function echo (ctx) {
  return html`<h1>I'm ${ctx._name} on the ${ctx._hasWindow ? 'client' : 'server'}</h1>`
})
```

#### Update

fun-component comes with a baked in default update function that performs a shallow diff of arguments to determine whether to update the component. By listening for the `update` event you may override this default behavior.

If you attach several `update` listerners the component will update if *any one* of them return `true`.

***Note**: Opposed to how nanocomponent calls the update function to determine whether to rerender the component, fun-component not only supplies the next arguments but also the previous arguments. These two can then be compared to determine whether to update.*

***Tip**: Using ES2015 array deconstructuring makes this a breeze.*

```javascript
var html = require('bel')
var component = require('fun-component')

var greeting = component(function greeting (ctx, name) {
  return html`<h1>Hello ${name}!</h1>`
})

// deconstruct arguments and compare `name`
greeting.on('update', function (ctx, [name], [prev]) {
  return name !== prev
})
```

### Plugins

Plugins are middleware functions that are called just before the component is rendered or updated. A plugin can inspect the arguments, modify the context object or even return another context object that is to be used for rendering the component.

```javascript
const html = require('bel')
const component = require('fun-component')

const greeter = component(function greeting(ctx, title) {
  return html`<h1>Hello ${title}!</h1>`
})

greeter.use(function log(ctx, title) {
  console.log(`Rendering ${ctx._ncID} with ${title}`)
  return ctx
})

document.body.appendChild(greeter('world'))
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
- List (using [spawn](spawn))
  - `npm run example:list`
  - https://fun-component-list.now.sh
- Expandable (using [spawn](spawn) and [restate](restate))
  - `npm run example:expandable`
  - https://fun-component-expandable.now.sh

### Composition and forking

Using lifecycle event listeners and plugins makes it very easy to lazily compose functions by attaching and removing event listeners as needed. But you may sometimes  wish to scope some listeners or plugins to a specific use case. To create a new component instance, inheriting all plugins and listeners, you may `fork` a component.

```javascript
// button.js
var html = require('bel')
var component = require('fun-component')

var button = component(function button (ctx, text, type, onclick) {
  return html`<button type="${type}" onclick=${onclick}>${text}</button>`
})

// only bother with updating the text
button.on('update', function (ctx, [text], [prev]) {
  return text !== prev
})

module.exports = button
```

```javascript
// form.js
var html = require('bel')
var component = require('fun-component')
var spawn = require('fun-component/spawn')
var restate = require('fun-component/restate')
var button = require('./button')

// fork button so that we can add custom plugins
var formButton = button.fork()

// spawn buttons based on their type
formButton.use(spawn((text, type) => type))

var form = component(function (ctx, error, submit) {
  return html`
    <form onsubmit=${onsubmit}>
      ${error}
      <input type="text" disabled=${ctx.state.busy} value="${ctx.state.text}" oninput=${oninput}>
      ${formButton('Clear', 'reset', onclear)}
      ${formButton(ctx.state.busy ? 'Saving' : 'Save', 'submit')}
    </form>
  `

  function oninput (event) {
    ctx.restate({text: event.target.value})
  }

  function onclear () {
    ctx.restate({text: ''})
  }

  function onsubmit (event) {
    event.preventDefault()

    // don't submit twice
    if (ctx.state.busy) return

    // update busy state and call submit callback
    ctx.restate({busy: true})
    submit(new FormData(event.target))
  }
})

// only update if an error occured while submitting
form.on('update', function (ctx, error, submit) {
  if (ctx.state.busy && error) {
    ctx.state.busy = false
    return true
  }
  return false
})

// use a local state for storing text and interactive state
form.use(restate({text: '', busy: false}))

module.exports = form
```

## Why tho?

Authoring a component should be as easy as writing a function. Using arguments and scope to handle a components lifecycle is obvious and straight forward. Whereas having to worry about calling context and stashing things on `this` makes for cognitive overhead.

Not for you? If you need more fine grained control or perfer a straight up object oriented programming approach, try using [nanocomponent](https://github.com/choojs/nanocomponent), it's what's powering fun-component behind the scenes.

## See Also

- [yoshuawuyts/microcomponent](https://github.com/yoshuawuyts/microcomponent)
- [jongacnik/component-box](https://github.com/jongacnik/component-box)
- [choojs/nanocomponent](https://github.com/choojs/nanocomponent)
- [choojs/choo](https://github.com/choojs/choo)
- [shama/bel](https://github.com/shama/bel)

## License

[MIT](https://tldrlegal.com/license/mit-license)
