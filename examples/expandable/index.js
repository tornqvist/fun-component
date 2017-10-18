/* eslint-env es6 */

const html = require('bel');
const morph = require('nanomorph');
const component = require(process.env.FUN_COMPONENT);
const restate = require('../../restate');
const spawn = require('../../spawn');

const expandable = component(function expandable(ctx, id, text) {
  const toggle = () => ctx.restate({expanded: !ctx.state.expanded});

  return html`
    <div>
      <button onclick=${ toggle }>${ ctx.state.expanded ? 'Close' : 'Open' }</button>
      <p style="display: ${ ctx.state.expanded ? 'block' : 'none' };">
        ${ text }
      </p>
    </div>
  `;
});

expandable.use(spawn(id => id));
expandable.use(restate({ expanded: false }));

const input = component(function input(ctx, id, text, oninput) {
  return html`
    <textarea rows="3" oninput=${ oninput }>
      ${ text }
    </textarea>
  `;
});

input.use(spawn(id => id));


const state = {};
morph(document.body, view(state));

function update(next) {
  morph(document.body, view(Object.assign(state, next)));
}

function view(state) {
  return html`
    <body class="App">
      ${ Array.from('123').map(id => html`
        <div>
          ${ input(id, state[id] || '', oninput(id)) }
          ${ expandable(id, state[id] || 'Nothing here') }
        </div>
      `) }
    </body>
  `;

  function oninput(id) {
    return event => {
      const value = event.target.value;
      update({ [id]: value });
    };
  }
}
