var assert = require('nanoassert')

// add state object and state management to the context object
// obj -> fn
module.exports = function init (initialState) {
  assert(typeof initialState === 'object', 'fun-component: initialState should be an object')

  return function restate (ctx) {
    if (!ctx.state) {
      ctx.state = Object.assign({}, initialState)
    }

    if (!ctx.restate) {
      // proxy rerender with state manager
      ctx.restate = function restate (next) {
        assert(typeof next === 'object', 'fun-component: state should be an object')
        Object.assign(ctx.state, next)
        return ctx.rerender()
      }
    }

    return ctx
  }
}
