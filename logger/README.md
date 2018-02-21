# fun-component/logger

Add a logger (using [nanologger](https://github.com/choojs/nanologger)) to the context object and log all lifecycle events.

## Usage

Access the nanologger instance under `ctx.log`.

```javascript
const html = require('bel')
const component = require('fun-component')

component(function hello (ctx, title) {
  return html`
    <div>
      Hello ${title}!
    </div>
  `
})

// enable logging during development
if (process.env.NODE_ENV === 'development') {
  component.use(require('fun-component/logger')())
}
```

## API

### `logger(opts)`

Create a middleware that adds an instance of nanologger to the `ctx.log` property. The opts are forwarded to [nanologger](https://github.com/choojs/nanologger).
