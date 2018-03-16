# fun-component/spawn

Create new component contexts on demand, optionally discarding them on unload.

## Usage

```javascript
const html = require('nanohtml')
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
article.use(spawn((props) => props.id))

function list (items) {
  return html`
    <main>
      ${items.map((item) => article(item))}
    </main>
  `
}
```

## API

### `spawn(identity[, opts])`

Returns a middleware function that creates a new context, identified by key. Takes a function and an (optional) options object.

The function passed to spawn should return a unique key (`string`) that is used to identify which context to use for rendering. The identity function will be called whenever the component needs to render or update. The arguments used to call the component are forwarded to the identity function for you to use to determine the key.

If the key is not recognized a new context is created. By default, the context is discarded when the element is removed from the DOM.

#### `opts.persist`

If set to `true` will keep the reference to the context after it is removed from the DOM. Defaults to `false`.

#### `opts.cache`

An object for storing context instances on. Will use common lru methods `get`, `set`, `remove` if defined, otherwise stores instances on the cache object by their identity.

```javascript
var LRU = require('nanolru')
var html = require('nanohtml')
var component = require('fun-component')

var cache = new LRU(3) // only ever allow a maximum of three instances of button
var button = component(function button (ctx, id, text, onclick) {
  return html`<button name="${id}" onclick=${onclick}>${text}</button>`
})

button.use(spawn((id) => id, {cache: cache}))

module.exports = button
```
