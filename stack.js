function Stack () {
  Array.call(this)
}

Stack.prototype = Object.create(Array.prototype)
Stack.prototype.constructor = Stack

Object.defineProperty(Stack.prototype, 'last', {
  get: function () {
    return this[this.length - 1]
  }
})

Stack.prototype.reset = function () {
  this.splice(0, this.length)
}

module.exports = new Stack()
