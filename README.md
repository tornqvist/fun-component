# fun-component [![stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

[![npm version](https://img.shields.io/npm/v/fun-component.svg?)](https://npmjs.org/package/fun-component) [![build status](https://img.shields.io/travis/tornqvist/fun-component/master.svg?style=flat-square)](https://travis-ci.org/tornqvist/fun-component)
[![downloads](http://img.shields.io/npm/dm/fun-component.svg?style=flat-square)](https://npmjs.org/package/fun-component)

A component wrapper library that exposes a single function and nothing else. Built on [nanocomponent](https://github.com/choojs/nanocomponent).

## Usage

```javascript
const html = require('bel');
const component = require('fun-component');

module.exports = component({
  name: 'my-component',
  update(element, [props], [prev]) {
    return props.color !== prev.color;
  },
  load(element, props) {
    this.debug(`mounted ${ this.name }: `, element);
  },
  unload(element, props) {
    this.debug(`unmounted ${ this.name }`);
  },
  render(props) {
    html`
      <h1 style="color:${ props.color }">Hello world!</h1>
    `;
  }
});
```

### Examples

For example implementations, see [/examples](/examples). Either spin them up locally or visit the link.

- Mapbox (using the `cache` option)
  - `npm run example:mapbox`
  - https://fun-component-mapbox.now.sh

## API

### `component(fn|object)`

Create a new component. Either takes a function as only argument or an object with a `render` method on it.

### Options

- `name {string}` Component name, used for debugging
- `cache {boolean}` Whether to save the element in-between mounts *Default: false*
- `render {function}` Create element
- `update {function}` Determine whether component should re-render *Default: shallow diff*
- `load {function}` Called *after* component is mounted in DOM
- `unload {function}` Called after component is removed from DOM
- `beforerender {function}` Called *before* component is added to DOM
- `afterupdate {function}` Called after update returns true
- `afterreorder {function}` Called after component is reordered

## See Also
- [yoshuawuyts/microcomponent](https://github.com/yoshuawuyts/microcomponent)
- [choojs/nanocomponent](https://github.com/choojs/nanocomponent)

## License
[MIT](https://tldrlegal.com/license/mit-license)

## TODO

- [ ] Add list example
