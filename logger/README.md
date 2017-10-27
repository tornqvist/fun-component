# fun-component/logger

Add a logger (using [nanologger](https://github.com/choojs/nanologger)) to the context object.

## Usage

Access the nanologger instance under `ctx.log`.

```javascript
const html = require('bel')
const component = require('fun-component')
const restate = require('fun-component/logger')

component(function hooks (ctx, title) {
  return html`
    <div onupdate=${update} onbeforerender=${beforerender} onload=${load} onunload=${unload} onafterupdate=${afterupdate} onafterreorder=${afterreorder}>
      Hello ${title}!
    </div>
  `
})

// enable logging
component.use(logger())

function update (ctx, [title], [prev]) {
  return title !== prev
}

function beforerender (ctx, title) {
  ctx.log.debug(`will render with ${title}`)
}

function load (ctx, title) {
  ctx.log.debug(`mounted in DOM with ${title}`)
}

function unload (ctx, title) {
  ctx.log.debug(`removed from DOM with ${title}`)
}

function afterupdate (ctx, title) {
  ctx.log.debug(`updated with ${title}`)
}

function afterreorder (ctx, title) {
  ctx.log.debug(`reordered with ${title}`)
}
```

## API

### `logger(options<object>)`

Create a middleware that adds an instance of nanologger to the `ctx.log` property. Options are forwarded to [nanologger](https://github.com/choojs/nanologger).
