# fun-component [![stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

[![npm version](https://img.shields.io/npm/v/fun-component.svg?)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)

A purely functional approach to authoring performant HTML components. Call ut syntactic suggar on top of [nanocomponent](https://github.com/choojs/nanocomponent), if you will. Pass in a function and fun-component will handle rerendering as needed when called upon.

## Usage

The most straight forward usage is to pass in a function and have the default shallow diff figure out whether to rerender the component on consecutive calls.

```javascript
const html = require('bel')
const component = require('fun-component')

const link = component(function user(ctx, id, name) {
  return html`<a href="/users/${ id }">${ name }</a>`
})

document.body.appendChild(link(123, 'Jane Doe'))
```

A stateful component can store state on the context and issue a rerender using the underlying nanocomponent.

```javascript
const html = require('bel')
const component = require('fun-component')
const restate = require('fun-component/restate')

const render = component(function expandable(ctx, text) {
  const expanded = ctx.expanded
  const toggle = () => {
    ctx.expanded = !expanded
    ctx.rerender()
  }

  html`
    <div>
      <button onclick=${ toggle }>${ expanded ? 'Close' : 'Open' }</button>
      <p style="display: ${ expanded ? 'block' : 'none' };">
        ${ text }
      </p>
    </div>
  `
})

document.body.appendChild(render('Hi there!'))
```

## API

### `component(function)`
### `component(string, function)`

Create a new component. Either takes a function as an only argument or a name and a function. Returns a function that renders the element. If no name is supplied the name is derrived from the functions `name` property. The name is used for logging using [nanologger](https://github.com/choojs/nanologger).

*Warning: implicit function names are most probably mangled during minification. If name consistency is important to your implementation, use the explicit name syntax: `component('hello', () => html`<h1>Hi there!</h1>`)`.*

### Context

The component context (`ctx`) is prefixed to the arguments of all lifecycle hooks and the render function itself. The component context can be used to access the underlying nanocomponent and nanologger objects.

```javascript
// Using nanologger and exposing nanocomponent inner workings
component('Echo', ctx => {
  ctx.debug(`Rendering ${ ctx._ncID }`)
  return html`<h1>I'm ${ ctx._name } from the ${ ctx._hasWindow ? 'client' : 'server' }</h1>`
})
```

### Reusing a component

Sometimes you'll want to create more than one instance of a component, for lists or repeat patterns.

#### `myComponent.create(string)`

Create a new component context. Takes a unique id. Returns new context object.

#### `myComponent.get(string)`

Get context by id. If no id is supplied, the base component context object is returned.

#### `myComponent.remove(string)`

Delete component context by id.

#### `myComponent.use(string, [...arguments])`

Creates and render component by id forwarding trailing arguments to render function. Returns element.

#### Example

Create and render multiple instances of base component `article`.

```javascript
const article = component(function article(ctx, props) {
  return html`
    <article>
      <img src="${ props.img }" alt="${ props.title }">
      <h2>${ props.title }</h2>
      <p>${ props.preamble }</p>
      <a href="/articles/${ props.id }">Read more</a>
    </article>
  `
})

function list(items) {
  return html`
    <main>
      ${ items.map(item => article.use(item.id, item)) }
    </main>
  `
}
```

### Lifecycle hooks

All the lifecycle hooks of nanocomponent are supported, i.e. [`beforerender`](https://github.com/choojs/nanocomponent#nanocomponentprototypebeforerenderel), [`load`](https://github.com/choojs/nanocomponent#nanocomponentprototypeloadel), [`unload`](https://github.com/choojs/nanocomponent#nanocomponentprototypeunloadel), [`afterupdate`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterupdateel), and [`afterreorder`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterreorderel). Lifecycle hooks are declared on the element itself (with an "on" prefix) and are forwarded to the underlying nanocomponent instance.

#### Example

Implement every lifecycle hook, logging latest argument on being called.

```javascript
component(function hooks(ctx, name) {
  return html`
    <div onupdate=${ update } onbeforerender=${ beforerender } onload=${ load } onunload=${ unload } onafterupdate=${ afterupdate } onafterreorder=${ afterreorder }>
      Hello ${ name }!
    </div>
  `
})

function update(ctx, [name], [prev]) {
  return name !== prev
}

function beforerender(ctx, name) {
  ctx.debug(`will to render with ${ name }`)
}

function load(ctx, name) {
  ctx.debug(`mounted in DOM with ${ name }`)
}

function unload(ctx, name) {
  ctx.debug(`removed from DOM with ${ name }`)
}

function afterupdate(ctx, name) {
  ctx.debug(`updated with ${ name }`)
}

function afterreorder(ctx, name) {
  ctx.debug(`reordered with ${ name }`)
}
```

## Caching

When working with 3rd party libraries you might *not* want the element to rerender everytime its being removed and added to the page. Previous versions of fun-component had element caching built in. Since this is easy enough to achieve in userland it was removed from core in version 3.

### Example

Cache mapbox instance and container element on ctx and reuse when being mounted in the DOM the next time.

```javascript
const render = component(function map(ctx, coordinates) {
  // Using nanocomponent `_loaded` member to check if it is mounted in the page
  if (!ctx._loaded && ctx.cached) {
    // If it is not mounted but has been cached, return cached element
    return ctx.cached
  }

  return html`
    <div class="Map" onupdate=${ update } onload=${ load }>
    </div>
  `
})

function update(ctx, [coordinates], [prev]) {
  if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
    ctx.map.setCenter([coordinates.lng, coordinates.lat])
  }
  return false
}

function load(ctx, coordinates) {
  if (ctx.cached) {
    ctx.map.setCenter([coordinates.lng, coordinates.lat]).resize()
  } else {
    ctx.cached = ctx.element
    ctx.map = new mapboxgl.Map({
      container: ctx.element,
      center: [coordinates.lng, coordinates.lat],
    })
  }
}
```

## Examples

For example implementations, see [/examples](/examples). Either spin them up locally or visit the link.

- Mapbox (using element caching)
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

## License

[MIT](https://tldrlegal.com/license/mit-license)
