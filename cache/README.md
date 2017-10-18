# fun-component – cache

Cache element on load and reuse on consecutive mounts.

## Usage

When working with 3rd party libraries you might *not* want the element to rerender everytime it is removed and added back to the page. This examples illustrates caching a Mapbox container element.

```javascript
const html = require('bel')
const component = require('fun-component')
const cache = require('fun-component/cache')

const render = component(function map(ctx, coordinates) {
  return html`
    <div class="Map" onupdate=${ update } onload=${ load }>
    </div>
  `
})

// Register cache middleware
render.use(cache())

function update(ctx, [coordinates], [prev]) {
  if (coordinates.lng !== prev.lng || coordinates.lat !== prev.lat) {
    ctx.map.setCenter([coordinates.lng, coordinates.lat])
  }
  return false
}

function load(ctx, coordinates) {
  if (ctx.map) {
    // Recenter if map has already been initialized
    ctx.map.setCenter([coordinates.lng, coordinates.lat]).resize()
  } else {
    // Initialize map with new element
    ctx.map = new mapboxgl.Map({
      container: ctx.element,
      center: [coordinates.lng, coordinates.lat],
    })
  }
}
```

## API

### `cache()`

Create middleware that saves a reference to mounted element as `ctx.cached`. Use this property to check whether a new element is being mounted or using the cache.

Unset `ctx.cached` to have a element be created on next render.

```javascript
const html = require('bel')
const component = require('fun-component')
const cache = require('fun-component/cache')

const render = component(function uncached(ctx) {
  return html`<div onunload=${ unload }></div>`
})

// Register cache middleware
render.use(cache())

function unload(ctx) {
  if (someCondition) {
    // Unset cache to create a new element on next render
    delete ctx.cached;
  }
}
```
