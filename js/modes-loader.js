// Small loader that fetches /data/modes.json and exposes window.MODES
// Usage: after this script loads, check window.MODES (array), or listen for "modes:loaded" event.

(function(){
  async function loadModes(){
    try {
      const resp = await fetch('/data/modes.json', {cache: 'no-store'});
      if(!resp.ok) throw new Error('Modes fetch failed: ' + resp.status);
      const json = await resp.json();
      window.MODES = json.modes || [];
      window.dispatchEvent(new CustomEvent('modes:loaded', { detail: { count: window.MODES.length }}));
      console.log('modes loaded', window.MODES.length);
    } catch (err){
      console.warn('Failed to load modes.json', err);
      window.MODES = window.MODES || [];
      window.dispatchEvent(new CustomEvent('modes:loaded', { detail: { count: window.MODES.length }}));
    }
  }
  document.addEventListener('DOMContentLoaded', loadModes);
})();