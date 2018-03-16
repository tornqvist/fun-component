# fun-component/cache

Cache component element for reuse.

## Usage

When working with 3rd party libraries you might *not* want the element to rerender every time it is removed and added back to the page. This examples illustrates caching a Mapbox container element.

```javascript
const html = require('nanohtml')
const component = require('fun-component')
const cache = require('fun-component/cache')

const map = component(function map (ctx, coordinates) {
  return html`<div class="Map"></div>`
})

// register cache middleware
map.use(cache())

map.on('load', function (ctx, el, coordinates) {
  if (ctx.map) {
    // recenter existing map
    ctx.map.setCenter([coordinates.lng, coordinates.lat])
  } else {
    // initialize new map
    ctx.map = new mapboxgl.Map({
      container: el,
      center: [coordinates.lng, coordinates.lat],
    })
  }
})

map.on('update', function (ctx, [coordinates], [prev]) {
  if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
    ctx.map.setCenter([coordinates.lng, coordinates.lat])
  }
  return false
})
```

## API

### `cache()`

Create middleware that saves a reference to mounted element as `ctx.cached`. Use this property to check whether a new element is being mounted or if using the cache.

## Clearing cached elements

Unset `ctx.cached` to have a element be re-created on next render.

```javascript
const html = require('nanohtml')
const component = require('fun-component')
const cache = require('fun-component/cache')

const render = component(function uncached (ctx) {
  return html`<div></div>`
})

// register cache middleware
render.use(cache())

render.on('unload', function (ctx) {
  // unset cache to create a new element on next render
  if (someCondition) delete ctx.cached
})
```
