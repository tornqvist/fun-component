# fun-component/cache

Cache element and reuse on consecutive mounts.

## Usage

When working with 3rd party libraries you might *not* want the element to rerender every time it is removed and added back to the page. This examples illustrates caching a Mapbox container element.

```javascript
const html = require('bel')
const component = require('fun-component')
const cache = require('fun-component/cache')

const render = component(function map (ctx, coordinates) {
  return html`<div class="Map"></div>`
})

// register cache middleware
render.use(cache())

render.on('update', function (ctx, [coordinates], [prev]) {
  if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
    ctx.map.setCenter([coordinates.lng, coordinates.lat])
  }
  return false
})

render.on('load', function (ctx, coordinates) {
  if (ctx.map) {
    // recenter if map has already been initialized
    ctx.map.setCenter([coordinates.lng, coordinates.lat]).resize()
  } else {
    // initialize map with new element
    ctx.map = new mapboxgl.Map({
      container: ctx.element,
      center: [coordinates.lng, coordinates.lat],
    })
  }
})
```

## API

### `cache()`

Create middleware that saves a reference to mounted element as `ctx.cached`. Use this property to check whether a new element is being mounted or if using the cache.

Unset `ctx.cached` to have a element be re-created on next render.

```javascript
const html = require('bel')
const component = require('fun-component')
const cache = require('fun-component/cache')

const render = component(function uncached (ctx) {
  return html`<div></div>`
})

// register cache middleware
render.use(cache())

render.on('unload', function (ctx) {
  if (someCondition) {
    // unset cache to create a new element on next render
    delete ctx.cached
  }
})
```
