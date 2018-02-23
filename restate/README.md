# fun-component/restate

Simple state manager that handles rerendering. Much like React `setState`.

## Usage

```javascript
const html = require('bel')
const component = require('fun-component')
const restate = require('fun-component/restate')

const expandable = component(function expandable (ctx, text) {
  const toggle = () => ctx.restate({ expanded: !ctx.state.expanded })

  return html`
    <div>
      <button onclick=${toggle}>${ctx.state.expanded ? 'Close' : 'Open'}</button>
      <p style="display: ${ctx.state.expanded ? 'block' : 'none'};">
        ${text}
      </p>
    </div>
  `
})

// set initial state of exandables to be collapsed
expandable.use(restate({ expanded: false }))

document.body.appendChild(expandable('Hi there!'))
```

## API

### `restate(initialState)`

Create a middleware that adds a `state` object and the `restate` method to context.

### `ctx.restate(nextState)`

Takes a new state as only argument. It updates the state and issues a rerender with the latest arguments.
