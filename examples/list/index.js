/* eslint-env es6 */

const html = require('bel');
const { elements } = require('periodic-table');
const morph = require('nanomorph');
const component = require(process.env.FUN_COMPONENT);

/**
 * Create a list of periodic table elements as components
 */

const rows = Object.keys(elements).map(key => elements[key]).map(props => {
  const render = component({
    name: props.name,
    position: null,

    /**
     * Save element offset of where it first appeared in the document
     * @param {HTMLElement} element
     */

    load(element) {
      this.offset = element.offsetTop;
    },

    /**
     * Translate element back to it's last known position then let it transition
     * into its new position
     * @param {HTMLElement} element
     */

    afterreorder(element) {
      const offset = element.offsetTop;
      element.style.transform = `translateY(${ this.offset - offset }px)`;
      this.offset = offset;

      requestAnimationFrame(() => {
        element.addEventListener('transitionend', function ontransitionend() {
          element.removeEventListener('transitionend', ontransitionend);
          element.classList.remove('in-transition');
        });
        element.classList.add('in-transition');
        element.style.transform = null;
      });
    },

    /**
     * Render some element data
     * @returns {HTMLElement}
     */

    render() {
      return html`
        <tr class="List-item">
          <td class="List-data">${ props.atomicNumber }</td>
          <td class="List-data">${ props.name } (${ props.symbol })</td>
          <td class="List-data">${ props.yearDiscovered }</td>
        </tr>
      `;
    }
  });

  /**
   * Mash up element properties with a render method
   */

  return Object.assign({ render }, props);
});

/**
 * Mount application on document body
 */

morph(document.body, view());

/**
 * Main view
 * @param {function} order
 * @param {boolean} reverse
 * @returns {HTMLElement}
 */

function view(order = byNumber, reverse = false) {

  /**
   * Rerender application using given sort function
   */

  const sort = next => () => morph(
    document.body,
    view(next, (next === order && !reverse))
  );

  /**
   * Create a new list of sorted rows
   */

  const items = rows.slice().sort(order);

  if (reverse) {
    items.reverse();
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
            <th><button class="Button ${ order === byNumber ? 'is-active' : '' } ${ reverse ? 'is-reversed' : '' }" onclick=${ sort(byNumber) }>Number</button></th>
            <th><button class="Button ${ order === byName ? 'is-active' : '' } ${ reverse ? 'is-reversed' : '' }" onclick=${ sort(byName) }>Name</button></th>
            <th><button class="Button ${ order === byDate ? 'is-active' : '' } ${ reverse ? 'is-reversed' : '' }" onclick=${ sort(byDate) }>Year Discovered</button></th>
          </tr>
        </thead>
        <tbody>
          ${ items.map(props => props.render()) }
        </tbody>
      </table>
    </body>
  `;
}

function byNumber(a, b) {
  return a.atomicNumber > b.atomicNumber ? 1 : -1;
}

function byName(a, b) {
  return a.name > b.name ? 1 : -1;
}

function byDate(a, b) {
  if (a.yearDiscovered === 'Ancient') {
    return -1;
  } else if (b.yearDiscovered === 'Ancient') {
    return 1;
  }

  return a.yearDiscovered > b.yearDiscovered ? 1 : -1;
}
