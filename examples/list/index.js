/* eslint-env es6 */

const html = require('bel')
const { elements } = require('periodic-table')
const morph = require('nanomorph')
const component = require('fun-component')
const spawn = require('fun-component/spawn')

/**
 * Generic row component
 */

const row = component(function element (ctx, props) {
  return html`
    <tr class="List-item" onupdate=${update}>
      <td class="List-data">${props.atomicNumber}</td>
      <td class="List-data">${props.name} (${props.symbol})</td>
      <td class="List-data">${props.yearDiscovered}</td>
    </tr>
  `
})

/**
 * Use atomic number as key for component context
 */

row.use(spawn(props => props.atomicNumber))

/**
 * Freeze element in position and translate into its new position
 * @param {component.Context} ctx
 * @param {array} [, index, done] Latest arguments
 * @param {array} [, prev] Previous arguments
 * @return {boolean} Prevent component from re-rendering
 */

function update (ctx, [, index, done], [, prev]) {
  if (index === prev) { return false }

  const { element } = ctx
  const from = element.offsetTop

  window.requestAnimationFrame(() => {
    const to = element.offsetTop

    element.style.transform = `translateY(${from - to}px)`

    window.requestAnimationFrame(() => {
      element.addEventListener('transitionend', function ontransitionend () {
        element.removeEventListener('transitionend', ontransitionend)
        element.classList.remove('in-transition')
        done()
      })

      element.classList.add('in-transition')
      element.style.transform = null
    })
  })

  return false
}

/**
 * Mount application on document body
 */

morph(document.body, view())

/**
 * Main view
 * @param {function} order
 * @param {boolean} reverse
 * @returns {HTMLElement}
 */

function view (order = byNumber, reverse = false, inTransition = false) {
  /**
   * Create a new list of sorted rows
   */

  const items = Object.values(elements).sort(order)

  if (reverse) {
    items.reverse()
  }

  return html`
    <body class="App">
      <div class="Text">
        <h1>List Example – fun-component</h1>
        <p>This is an example illustrating list reordering using <a href="https://github.com/tornqvist/fun-component">fun-component</a>, a performant component encapsulated as a function.</p>
      </div>
      <table class="List">
        <thead>
          <tr>
            <th><button disabled=${inTransition} class="Button ${order === byNumber ? 'is-active' : ''} ${reverse ? 'is-reversed' : ''}" onclick=${sort(byNumber)}>Number</button></th>
            <th><button disabled=${inTransition} class="Button ${order === byName ? 'is-active' : ''} ${reverse ? 'is-reversed' : ''}" onclick=${sort(byName)}>Name</button></th>
            <th><button disabled=${inTransition} class="Button ${order === byDate ? 'is-active' : ''} ${reverse ? 'is-reversed' : ''}" onclick=${sort(byDate)}>Year Discovered</button></th>
          </tr>
        </thead>
        <tbody>
          ${items.map((props, index) => row(props, index, done))}
        </tbody>
      </table>
    </body>
  `

  /**
   * Rerender application using given sort function
   */

  function sort (next) {
    return function () {
      morph(document.body, view(next, (next === order && !reverse), true))
    }
  }

  /**
   * Rerender application with active buttons
   */

  function done () {
    if (inTransition) {
      inTransition = false
      morph(document.body, view(order, reverse, inTransition))
    }
  }
}

function byNumber (a, b) {
  return a.atomicNumber > b.atomicNumber ? 1 : -1
}

function byName (a, b) {
  return a.name > b.name ? 1 : -1
}

function byDate (a, b) {
  if (a.yearDiscovered === 'Ancient') {
    return -1
  } else if (b.yearDiscovered === 'Ancient') {
    return 1
  }

  return a.yearDiscovered > b.yearDiscovered ? 1 : -1
}
