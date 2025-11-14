// Small loader that fetches /data/modes.json and exposes window.MODES
// Usage: after this script loads, check window.MODES (array), or listen for "modes:loaded" event.

(function(){
  async function loadModes(){
    try {
      const resp = await fetch('/data/modes.json', {cache: 'no-store'});
      if(!resp.ok) throw new Error('Modes fetch failed: ' + resp.status);
      const json = await resp.json();
      
      // Validate JSON structure
      if (!json || typeof json !== 'object') {
        throw new Error('Invalid JSON structure');
      }
      
      if (!Array.isArray(json.modes)) {
        throw new Error('Modes must be an array');
      }
      
      // Validate each mode
      const validModes = json.modes.filter(mode => {
        if (!mode || typeof mode !== 'object') return false;
        if (!mode.id || typeof mode.id !== 'string') return false;
        if (!mode.title || typeof mode.title !== 'string') return false;
        if (!mode.description || typeof mode.description !== 'string') return false;
        if (!mode.color || typeof mode.color !== 'string') return false;
        if (!Array.isArray(mode.activities)) return false;
        return true;
      });
      
      if (validModes.length === 0) {
        throw new Error('No valid modes found');
      }
      
      window.MODES = validModes;
      window.dispatchEvent(new CustomEvent('modes:loaded', { detail: { count: window.MODES.length }}));
      console.log('modes loaded', window.MODES.length);
    } catch (err){
      console.error('Failed to load modes.json', err);
      window.MODES = window.MODES || [];
      window.dispatchEvent(new CustomEvent('modes:loaded', { detail: { count: window.MODES.length, error: err.message }}));
    }
  }
  document.addEventListener('DOMContentLoaded', loadModes);
})();
