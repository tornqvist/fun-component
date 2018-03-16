# fun-component/logger

Log all lifecycle events. Using [nanologger](https://github.com/choojs/nanologger).

## Usage

Access the nanologger instance under `ctx.log`.

```javascript
const html = require('nanohtml')
const component = require('fun-component')

var hello = component(function hello (ctx, title) {
  return html`
    <div>
      Hello ${title}!
    </div>
  `
})

// enable logging during development
if (process.env.NODE_ENV === 'development') {
  hello.use(require('fun-component/logger')())
}
```

## API

### `logger([opts])`

Create a middleware that adds an instance of nanologger to the `ctx.log` property. The opts are forwarded to [nanologger](https://github.com/choojs/nanologger).
