/* globals mapboxgl */
/* eslint-env es6 */

const html = require('bel');
const morph = require('nanomorph');
const component = require(process.env.FUN_COMPONENT);

const MAPBOX_TOKEN = 'pk.eyJ1IjoidG9ybnF2aXN0IiwiYSI6ImNqN2RjZHpmbTA1cjIzM3BmaGpkZnQxNHEifQ.ZSG3Gi0X-8Fane8_u9LdeQ';
const MAPBOX_URL = 'https://api.mapbox.com/mapbox-gl-js/v0.39.1/mapbox-gl.js';
const INITIAL_STATE = {
  lng: 18.0704503,
  lat: 59.3244897,
  error: null,
  positioned: false,
  isLoading: false,
  href: window.location.pathname
};

/**
 * Create Mapbox container component
 */

const map = component({
  name: 'mapbox',

  /**
   * ==> This is where the magic happens! <==
   * By setting cached to `true` we are telling fun-component to keep a
   * reference to the element after it has been unmounted from the DOM so that
   * it gets re-inserted the next time it renders and we won't have to
   * initialize Mapbox and load all the tiles again.
   */

  cache: true,

  /**
   * Initial component state stored on self
   */

  map: null,
  popup: null,
  isMounted: false,

  /**
   * Place popup on map at given coordinates
   * @param {number} lng
   * @param {number} lat
   */

  placePopup(lng, lat) {
    const wasOpen = this.popup.isOpen();

    this.popup
      .setLngLat([lng, lat])
      .setText('You are here')
      .addTo(this.map);

    if (!wasOpen) { this.log.info('Popup added'); }
  },

  /**
   * Determine whether to update map location and place popup
   * @param {HTMLElement} element
   * @param {array} args List of latest arguments used to render component
   * @param {array} prev List of previous arguments used to render component
   * @returns {boolean} Always prevent component from rerendering
   */

  update(element, args, prev) {
    if (!this.map) { return false; }

    const data = args.slice(0, 3);

    if (data.reduce((changed, arg, i) => changed || arg !== prev[i], false)) {
      const [ lng, lat, positioned ] = args;

      this.map.panTo([lng, lat]);

      if (positioned && this.isMounted) {
        this.placePopup(lng, lat);
      } else if (this.popup.isOpen()) {
        this.popup.remove();
      }
    }

    return false;
  },

  /**
   * If the map hasn't been initialized already, load Mapbox and create map
   * @param {HTMLElement} element
   * @param {number} lng
   * @param {number} lat
   * @param {boolean} positioned
   * @param {function} loading
   */

  load(element, lng, lat, positioned, loading) {
    this.isMounted = true;

    if (!this.map) {
      const script = html`<script src="${ MAPBOX_URL }" onload=${ onload }></script>`;

      loading(true);

      script.onload = () => {
        this.log.info('Mapbox script loaded');

        mapboxgl.accessToken = MAPBOX_TOKEN;
        this.map = new mapboxgl.Map({
          container: element,
          center: [lng, lat],
          zoom: 11,
          style: 'mapbox://styles/mapbox/streets-v9'
        });

        this.popup = new mapboxgl.Popup({
          closeOnClick: false,
          closeButton: false
        });

        this.map.on('load', () => {
          this.log.info('Mapbox tiles loaded');
          loading(false);
          if (positioned) {
            this.placePopup(lng, lat);
          }
        });
      };

      document.head.appendChild(script);
    }
  },

  /**
   * Remove the popup when unmounting the map
   */

  unload() {
    this.isMounted = false;

    if (this.popup.isOpen()) {
      this.popup.remove();
      this.log.info('Popup removed');
    }
  },

  /**
   * Create map container element
   */

  render() {
    return html`<div class="Map-container"></div>`;
  }
});

/**
 * A component can also just be a plain function.
 * As long as the arguments doesn't differ between renders, this view is cached
 * and won't execute upon rerenders.
 */

const about = component(function page() {
  return html`
    <article class="Text">
      <h1>Mapbox Example – fun-component</h1>
      <p>This page is for illustrating that if you go back to the map, it has been cached and does not need to initialize the Mapbox instance again upon mounting in the DOM.</p>
      <p>This is an example implementation of Mapbox using <a href="https://github.com/tornqvist/fun-component">fun-component</a>, a performant component encapsulated as a function.</p>
    </article>
  `;
});

/**
 * Set up history routing handlers
 */

window.history.replaceState(INITIAL_STATE, document.title, window.location.pathname);
window.onpopstate = event => morph(document.body, view(event.state));

/**
 * Mount app in DOM
 */

morph(document.body, view(INITIAL_STATE));

/**
 * Main view, nothing special, really
 */

function view(state = {}) {
  return html`
    <body class="App">
      <div class="Error">${ state.error }</div>
      <nav class="Menu">
        <a class="Menu-item" onclick=${ navigate } href="/">Map</a>
        <a class="Menu-item" onclick=${ navigate } href="/about">About</a>
      </nav>
      ${ state.href === '/' ? html`
        <div class="Map">
          ${ map(state.lng, state.lat, state.positioned, loading) }
          <button disabled=${ state.isLoading } onclick=${ locate } class="Button">Where am I?</button>
        </div>
      ` : about() }
    </body>
  `;

  /**
   * Toggle loading state of application
   * @param {boolean} isLoading
   */

  function loading(isLoading) {
    morph(document.body, view(Object.assign({}, state, { isLoading })));
  }

  /**
   * Handle navigating between views
   * @param {object} event
   */

  function navigate(event) {
    const href = event.target.pathname;
    const next = Object.assign({}, state, { href });
    window.history.pushState(next, document.title, href);
    morph(document.body, view(next));
    event.preventDefault();
  }

  /**
   * Find user location
   */

  function locate() {
    morph(document.body, view(Object.assign({}, state, { isLoading: true })));
    navigator.geolocation.getCurrentPosition(
      (position) => morph(document.body, view(Object.assign({}, state, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null,
        positioned: true
      }))),
      err => morph(document.body, view(Object.assign({}, state, {
        error: err.message,
        positioned: false
      })))
    );
  }
}
