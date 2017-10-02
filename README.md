# fun-component [![stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

[![npm version](https://img.shields.io/npm/v/fun-component.svg?)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)

A pure functional approach to authoring HTML components. Really just syntactic suggar on top of [nanocomponent](https://github.com/choojs/nanocomponent).

## Usage

The most straight forward usage is to pass in a function and have the default shallow diff figure out whether to rerender the component on consecutive calls.

```javascript
const html = require('bel')
const component = require('fun-component')

component(function user(user) {
  return html`<a href="/users/${ user._id }">${ user.name }</a>`
})
```

Here's an example of how you might create a stateful component.

```javascript
const html = require('bel')
const component = require('fun-component')

function createExpandable(expanded = false) {
  let isExpanded = expanded

  return component(function expandable() {
    const toggle = () => {
      isExpanded = !isExpanded
      this.rerender()
    }

    return html`
      <button onclick=${ toggle }>Expand</button>
      <p style="display: ${ isExpanded ? 'block' : 'none' };">
        Lorem ipsum dolor sit…
      </p>
    `
  })
}
```

## API

### `component(function)`
### `component(string, function)`

Create a new component. Either takes a function as an only argument or a name and a function. If no name is supplied the name is derrived from the function's `name` property. The name is used for logging using [nanologger](https://github.com/choojs/nanologger), enable it through `localStorage.setItem('logLevel', 'debug|info|warn|error|fatal')`.

The underlying nanocomponent and nanologger instances are exposed on the calling context (`this`) in all lifecycle hooks and the render function iteself.

### Lifecycle hooks

All the lifecycle hooks of nanocomponent are supported, i.e. [`beforerender`](https://github.com/choojs/nanocomponent#nanocomponentprototypebeforerenderel), [`load`](https://github.com/choojs/nanocomponent#nanocomponentprototypeloadel), [`unload`](https://github.com/choojs/nanocomponent#nanocomponentprototypeunloadel), [`afterupdate`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterupdateel), and [`afterreorder`](https://github.com/choojs/nanocomponent#nanocomponentprototypeafterreorderel). Lifecycle hooks are declared on the element itself and are forwarded to the underlying nanocomponent instance.

<details>
<summary>See example</summary>

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
  this.debug(`${ name }`)
}
```

</details>

## Caching

Previous versions of fun-component had caching built in. Since this is easy enough to achieve in userland it was removed from core in version 3.

<details>
<summary>See example</summary>

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

    function update(element, [coordinates], [prev]) {
      if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
        map.setCenter([coordinates.lng, coordinates.lat])
      }
      return false
    }

    function load(element, coordinates) {
      cached = element

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
  })
}
```

</details>

## Examples

For example implementations, see [/examples](/examples). Either spin them up locally or visit the link.

- Mapbox (using the above caching pattern)
  - `npm run example:mapbox`
  - https://fun-component-mapbox.now.sh
- List (creating unique instances with `use`)
  - `npm run example:list`
  - https://fun-component-list.now.sh

## Why tho?

Authoring a component should be as easy as writing a function. Using arguments and scope to handle state is both implicit and transparent. Worrying about calling context, and stashing things on `this` makes for cognitive overhead.

Not for you? If OOP is your thing, use [nanocomponent](https://github.com/choojs/nanocomponent). If you're more into events, maybe [microcomponent](https://github.com/yoshuawuyts/microcomponent) is a good fit.

## See Also

- [yoshuawuyts/microcomponent](https://github.com/yoshuawuyts/microcomponent)
- [jongacnik/component-box](https://github.com/jongacnik/component-box)
- [choojs/nanocomponent](https://github.com/choojs/nanocomponent)

## License

[MIT](https://tldrlegal.com/license/mit-license)
