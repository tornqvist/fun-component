var assert = require('nanoassert')

module.exports = function init (initialState) {
  assert(typeof initialState === 'object', 'state must be an object')

  return function restate (ctx) {
    if (!ctx.state) {
      ctx.state = Object.assign({}, initialState)
    }

    if (!ctx.restate) {
      ctx.restate = function restate (next) {
        assert(typeof next === 'object', 'state must be an object')
        Object.assign(ctx.state, next)
        return ctx.rerender()
      }
    }

    return ctx
  }
}
