function Stack () {
  Array.call(this)
}

Stack.prototype = Object.create(Array.prototype)
Stack.prototype.constructor = Stack

Stack.prototype.top = function () {
  return this[this.length - 1]
}

Stack.prototype.reset = function () {
  this.splice(0, this.length)
}

module.exports = new Stack()
