# fun-component – restate

Add state and state update utility to the context object.

## Usage

```javascript
const html = require('bel')
const component = require('fun-component')
const restate = require('fun-component/restate')

const render = component(function expandable(ctx, text) {
  const toggle = () => ctx.restate({ expanded: !ctx.state.expanded })

  html`
    <div>
      <button onclick=${ toggle }>${ ctx.state.expanded ? 'Close' : 'Open' }</button>
      <p style="display: ${ ctx.state.expanded ? 'block' : 'none' };">
        ${ text }
      </p>
    </div>
  `
})

// Set all exandables to initially be collapsed
render.use(restate({ expanded: false }))

document.body.appendChild(render('Hi there!'))
```

## API

### `restate(initialState<object>)`

Create a middleware that adds a `state` object and the `restate` method to context.

### `ctx.restate(next<object>)`

Restate takes a new state as only argument. It updates the state and issues a rerender.

## FAQ

### Is this like React `setState`?

Yea, pretty much.
