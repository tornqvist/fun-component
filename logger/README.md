# fun-component – logger

Add a logger (using [nanologger](https://github.com/choojs/nanologger)) to the context object.

## Usage

Access the nanologger instance under `ctx.log`.

```javascript
const html = require('bel')
const component = require('fun-component')
const restate = require('fun-component/logger')

component(function hooks(ctx, name) {
  return html`
    <div onupdate=${ update } onbeforerender=${ beforerender } onload=${ load } onunload=${ unload } onafterupdate=${ afterupdate } onafterreorder=${ afterreorder }>
      Hello ${ name }!
    </div>
  `
})

// Enable logging
component.use(logger())

function update(ctx, [name], [prev]) {
  return name !== prev
}

function beforerender(ctx, name) {
  ctx.log.debug(`will to render with ${ name }`)
}

function load(ctx, name) {
  ctx.log.debug(`mounted in DOM with ${ name }`)
}

function unload(ctx, name) {
  ctx.log.debug(`removed from DOM with ${ name }`)
}

function afterupdate(ctx, name) {
  ctx.log.debug(`updated with ${ name }`)
}

function afterreorder(ctx, name) {
  ctx.log.debug(`reordered with ${ name }`)
}
```

## API

### `logger(options<object>)`

Create a middleware that adds an instance of nanologger to the `ctx.log` property. Options are forwarded to [nanologger](https://github.com/choojs/nanologger).
