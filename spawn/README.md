# fun-component – spawn

Spawn component contexts on demand and discard on unload.

## Usage

```javascript
const html = require('bel')
const component = require('fun-component')
const spawn = require('fun-component/spawn')

const article = component(function article(ctx, props) {
  return html`
    <article>
      <img src="${ props.img.src }" alt="${ props.img.alt }">
      <h2>${ props.title }</h2>
      <p>${ props.preamble }</p>
      <a href="/articles/${ props.id }">Read more</a>
    </article>
  `
})

// Use `props.id` as key to identify context
component.use(spawn(props => props.id))

function list(items) {
  return html`
    <main>
      ${ items.map(item => article(item)) }
    </main>
  `
}
```

## API

### `spawn(identity<function>)`

Create a middleware function that spawns a new context identified by key. Takes a function as only argument.

The function passed to spawn should return a unique key that is used to identify which context to use for rendering.

If the key is not recognized a new context is created. The context is discarded when the element is removed from the DOM.
