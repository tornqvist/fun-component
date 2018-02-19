# fun-component/spawn

Spawn component contexts on demand and discard on unload.

## Usage

```javascript
const html = require('bel')
const component = require('fun-component')
const spawn = require('fun-component/spawn')

const article = component(function article (ctx, props) {
  return html`
    <article>
      <img src="${props.img.src}" alt="${props.img.alt}">
      <h2>${props.title}</h2>
      <p>${props.intro}</p>
      <a href="/articles/${props.id}">Read more</a>
    </article>
  `
})

// use `props.id` as key to identify context
article.use(spawn(props => props.id))

function list (items) {
  return html`
    <main>
      ${items.map(item => article(item))}
    </main>
  `
}
```

## API

### `spawn(identity[, cache])`

Create a middleware function that spawns a new context identified by key. Takes a function as first argument, and optionally a cache object as second.

The function passed to spawn should return a unique key that is used to identify which context to use for rendering. The identity function will be called whenever the component needs to render or update. The arguments used to call the component are forwarded to the identity function for you to use to determine the key.

If the key is not recognized a new context is created. The context is discarded when the element is removed from the DOM.
