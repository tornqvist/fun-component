<div align="center">

# fun-component `<🙂/>`

[![npm version](https://img.shields.io/npm/v/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)
[![style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://npmjs.org/package/fun-component)

</div>

Performant and functional HTML components with plugins. Syntactic suggar on top of [nanocomponent](https://github.com/choojs/nanocomponent).

- [Usage](#usage)
- [API](#api)
  - [Lifecycle events](#lifecycle-events)
  - [Plugins](#plugins)
  - [Composition and forking](#composition-and-forking)
- [Examples](#examples)
- [Why tho?](#why-tho)

## Usage

Pass in a function and get another one back that handles rerendering.

```javascript
// button.js
var html = require('bel')
var component = require('fun-component')

var button = module.exports = component(function button (ctx, clicks, onclick) {
  return html`
    <button onclick=${onclick}>
      Clicked ${clicks} times
    </button>
  `
})

// only bother updating if text changed
button.on('update', function (ctx, [text], [prev]) {
  return text !== prev
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
      ${button(state.clicks, () => emit('emit'))}
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

Though fun-component was authored with [choo](https://github.com/choojs/choo) in mind it works just as well standalone.

```javascript
var button = require('./button')

var clicks = 0
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
var button = component('button', (text) => html`<button>${text}</button>`)
```

#### `button.on(name, fn)`

Add lifecycle event listener, see [Lifecycle events](#lifecycle-events).

#### `button.off(name, fn)`

Remove lifecycle eventlistener, see [Lifecycle events](#lifecycle-events).

#### `button.use(fn)`

Add plugin, see [Plugins](#plugins).

#### `button.fork()`

Create a new component context inheriting listeners and plugins, see [Composition and forking](#composition-and-forking)

### Lifecycle events

All the lifecycle hooks of nanocomponent are supported, i.e. [`beforerender`](https://github.com/choojs/nanocomponent#nanocomponentprototypebeforerenderel), [`load`](https://github.com/choojs/nanocomponent#nanocomponentprototypeloadel), [`unload`](https://github.com/choojs/nanocomponent#nanocomponentprototypeunloadel), [`afterupdate`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterupdateel), and [`afterreorder`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterreorderel). Any number of listeners can be added for an event. The arguments are always prefixed with the component context and the element, followed by the render arguments.

```javascript
var html = require('bel')
var component = require('fun-component')

var greeting = component(function greeting (ctx, name) {
  return html`<h1>Hello ${name}!</h1>`
})

greeting.on('load', function (ctx, el, name) {
  console.log(`element ${name} is now in the DOM`)
}

greeting.on('afterupdate', function (ctx, el, name) {
  console.log(`element ${name} was updated`)
}

document.body.appendChild(greeting('world'))
greeting('planet')
```

#### Context

The component context (`ctx`) is prefixed to the arguments of all lifecycle events and the render function itself. The context object can be used to access the underlying [nanocomponent](https://github.com/choojs/nanocomponent).

```javascript
var html = require('bel')
var component = require('fun-component')

// exposing nanocomponent inner workings
module.exports = component(function time (ctx) {
  return html`
    <div>
      The time is ${new Date()}
      <button onclick=${() => ctx.rerender())}>What time is it?</button>
    </div>
  `
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

const greeter = component(function greeting (ctx, title) {
  return html`<h1>Hello ${title}!</h1>`
})

greeter.use(function log(ctx, title) {
  console.log(`Rendering ${ctx._ncID} with ${title}`)
  return ctx
})

document.body.appendChild(greeter('world'))
```

fun-component is bundled with with a handfull of plugins that cover the most common scenarios. Have you written a plugin you want featured in this list? Fork, add, and make a pull request.

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

var button = module.exports = component(function button (ctx, text, onclick) {
  return html`<button onclick=${onclick}>${text}</button>`
})

// only bother with updating the text
button.on('update', function (ctx, [text], [prev]) {
  return text !== prev
})
```

```javascript
// infinite-tweets.js
var html = require('bel')
var component = require('fun-component')
var onIntersect = require('on-intersect')
var button = require('./button')

module.exports = list

// fork button so that we can add custom behavior
var paginator = button.fork()

// automatically click button when in view
paginator.on('load', function (ctx, el, text, onclick) {
  var disconnect = onIntersect(el, onclick)
  paginator.on('unload', disconnect)
})

function list (tweets, paginate) {
  return html`
    <div>
      <ul>
        ${tweets.map(tweet => html`
          <article>
            <time>${tweet.created_at}</time><br>
            <a href="https://twitter.com/${tweet.user.screen_name}">
              @${tweet.user.screen_name}
            </a>
            <p>${tweet.text}</p>
          </article>
        `)}
      </ul>
      ${paginator('Show more', paginate)}
    </div>
  `
}
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
