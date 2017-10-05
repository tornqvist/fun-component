# fun-component [![stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

[![npm version](https://img.shields.io/npm/v/fun-component.svg?)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)

A purely functional approach to authoring performant HTML components. Call ut syntactic suggar on top of [nanocomponent](https://github.com/choojs/nanocomponent), if you will. Pass in a function and fun-component will handle rerendering as needed when called upon.

## Usage

The most straight forward usage is to pass in a function and have the default shallow diff figure out whether to rerender the component on consecutive calls.

```javascript
const html = require('bel')
const component = require('fun-component')

const link = component(function user(props) {
  return html`<a href="/users/${ props._id }">${ props.name }</a>`
})

document.body.appendChild(link({ id: 123, name: 'Jane Doe' }))
```

A stateful component can issue a rerender using the underlying nanocomponent, prividing the next state.

```javascript
const html = require('bel')
const component = require('fun-component')

const expandable = component(function expandable(text, { expanded = false }) {
  const toggle = () => this.render(text, { expanded: !expanded })

  return html`
    <div onupdate=${ update }>
      <button onclick=${ toggle }>${ expanded ? 'Close' : 'Open' }</button>
      <p style="display: ${ expanded ? 'block' : 'none' };">
        ${ text }
      </p>
    </div>
  `
})

function update(el, [text, state], [prevText, prevState]) {
  return text !== prevText || (state && state.expanded !== prevState.expanded);
}

document.body.appendChild(expandable('Hi there!'))
```

## API

### `component(function)`
### `component(string, function)`

Create a new component. Either takes a function as an only argument or a name and a function. Returns a function that renders the element. If no name is supplied the name is derrived from the function's `name` property. The name is used for logging using [nanologger](https://github.com/choojs/nanologger).

*Warning: implicit function names are most probably mangled during minification. If name consistency is important to your implementation, use the explicit name syntax: `component('thing', function () { … })`.*

The underlying nanocomponent and nanologger instances are exposed on the calling context (`this`) in all lifecycle hooks as well as the render function itself and can be accessed as such `this.rerender()` or `this.debug('hello there')`.

#### `myComponent.create(string)`

Create a named instance, a "subclass" if you will, of a component. Returns its underlying component instance.

#### `myComponent.get(string)`

Get component instance by name. If no name is supplied, base component is returned.

#### `myComponent.delete(string)`

Delete component instance by name.

#### `myComponent.use(string, [...arguments])`

Creates and render named component forwarding trailing arguments to render function. Returns element.

#### Example

Create multiple instances of base component `article` using an id as unique key and delete all instances on unload.

```javascript
const article = component(function article(props) {
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
    <main onunload=${ cleanup }>
      <h1>List of articles</h1>
      ${ items.map(item => article.use(item.id, item)) }
    </main>
  `
}

function cleanup(el, items) {
  items.forEach(item => article.delete(item.id));
}
```

### Lifecycle hooks

All the lifecycle hooks of nanocomponent are supported, i.e. [`beforerender`](https://github.com/choojs/nanocomponent#nanocomponentprototypebeforerenderel), [`load`](https://github.com/choojs/nanocomponent#nanocomponentprototypeloadel), [`unload`](https://github.com/choojs/nanocomponent#nanocomponentprototypeunloadel), [`afterupdate`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterupdateel), and [`afterreorder`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterreorderel). Lifecycle hooks are declared on the element itself (with an "on" prefix) and are forwarded to the underlying nanocomponent instance.

#### Example

Implement every lifecycle hook, logging latest argument on being called.

```javascript
component(function hooks(name) {
  return html`
    <div onupdate=${ update } onbeforerender=${ beforerender } onload=${ load } onunload=${ unload } onafterupdate=${ afterupdate } onafterreorder=${ afterreorder }>
      Hello ${ name }!
    </div>
  `
})

function update(el, [name], [prev]) {
  return name !== prev
}

function beforerender(el, name) {
  this.debug(`${ name } about to render`)
}

function load(el, name) {
  this.debug(`${ name } mounted in DOM`)
}

function unload(name) {
  this.debug(`${ name } removed from DOM`)
}

function afterupdate(el, name) {
  this.debug(`${ name } updated`)
}

function afterreorder(el, name) {
  this.debug(`${ name } reordered`)
}
```

## Caching

When working with 3rd party libraries you might *not* want to rerender the element after it has been removed from the DOM. Previous versions of fun-component had element caching built in. Since this is easy enough to achieve in userland it was removed from core in version 3.

### Example

Cache mapbox instance and element in scoped variables on load and reuse when being mounted in the DOM the next time.

```javascript
function createMap(name = 'map') {
  let map, cached

  return component(name, function (coordinates) {
    if (!this._loaded && cached) {
      return cached
    }

    return html`
      <div class="Map" onupdate=${ update } onload=${ load }>
      </div>
    `
  })

  function update(element, [coordinates], [prev]) {
    if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
      map.setCenter([coordinates.lng, coordinates.lat])
    }
    return false
  }

  function load(element, coordinates) {
    if (cached) {
      map.setCenter([coordinates.lng, coordinates.lat]).resize()
    } else {
      cached = element
      map = new mapboxgl.Map({
        container: element,
        center: [coordinates.lng, coordinates.lat],
      })
    }
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

## Todo

- [ ] Add statefull example

## License

[MIT](https://tldrlegal.com/license/mit-license)
