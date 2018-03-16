const html = require('nanohtml')
const morph = require('nanomorph')
const component = require('fun-component')
const spawn = require('fun-component/spawn')
const { elements } = require('periodic-table')

const row = component(function element (ctx, props) {
  return html`
    <tr class="List-item">
      <td class="List-data">${props.atomicNumber}</td>
      <td class="List-data">${props.name} (${props.symbol})</td>
      <td class="List-data">${props.yearDiscovered}</td>
    </tr>
  `
})

row.on('load', function (ctx, element) {
  // stash initial offset on ctx
  ctx.offset = element.offsetTop
})

row.on('afterupdate', function (ctx, element, props, index, done) {
  if (!ctx.offset) return
  window.requestAnimationFrame(function () {
    const offset = element.offsetTop

    // put element back at previous offset
    element.style.transform = `translateY(${ctx.offset - offset}px)`

    window.requestAnimationFrame(function () {
      element.addEventListener('transitionend', function ontransitionend () {
        element.removeEventListener('transitionend', ontransitionend)
        element.classList.remove('in-transition')
        ctx.offset = offset
        done()
      })

      // trigger transition
      element.classList.add('in-transition')
      element.style.removeProperty('transform')
    })
  })
})

// use atomic number as key for component context
row.use(spawn((props) => props.atomicNumber.toString()))

// mount application on document body
morph(document.body, view())

// main view
// (fn, bool, bool) -> HTMLElement
function view (order = byNumber, reverse = false, inTransition = false) {
  // create a new list of sorted rows
  const items = Object.values(elements).sort(order)
  if (reverse) items.reverse()

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

  // rerender application using given sort function
  // fn -> fn
  function sort (next) {
    return function () {
      morph(document.body, view(next, (next === order && !reverse), true))
    }
  }

  // rerender application with active buttons
  // () -> void
  function done () {
    if (!inTransition) return
    inTransition = false
    morph(document.body, view(order, reverse, inTransition))
  }
}

// sort by atomic number
// (obj, obj) -> num
function byNumber (a, b) {
  return a.atomicNumber > b.atomicNumber ? 1 : -1
}

// sort by atom name
// (obj, obj) -> num
function byName (a, b) {
  return a.name > b.name ? 1 : -1
}

// sort by date discovered
// (obj, obj) -> num
function byDate (a, b) {
  if (a.yearDiscovered === 'Ancient') return -1
  else if (b.yearDiscovered === 'Ancient') return 1
  return a.yearDiscovered > b.yearDiscovered ? 1 : -1
}
