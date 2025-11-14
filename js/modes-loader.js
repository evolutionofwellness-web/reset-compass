// Small loader that fetches /data/modes.json and /data/activities.json
// Merges comprehensive activities from activities.json with mode metadata from modes.json
// Exposes window.MODES and window.ACTIVITIES
// Usage: after this script loads, check window.MODES (array), or listen for "modes:loaded" event.

(function(){
  async function loadModes(){
    try {
      // Load both modes.json (metadata) and activities.json (comprehensive activities)
      const [modesResp, activitiesResp] = await Promise.all([
        fetch('/data/modes.json', {cache: 'no-store'}),
        fetch('/data/activities.json', {cache: 'no-store'})
      ]);
      
      if(!modesResp.ok) throw new Error('Modes fetch failed: ' + modesResp.status);
      if(!activitiesResp.ok) {
        console.warn('Activities fetch failed: ' + activitiesResp.status + ', falling back to modes.json activities');
      }
      
      const modesJson = await modesResp.json();
      let activitiesJson = null;
      
      try {
        if (activitiesResp.ok) {
          activitiesJson = await activitiesResp.json();
        }
      } catch (err) {
        console.warn('Failed to parse activities.json:', err);
      }
      
      // Validate modes JSON structure
      if (!modesJson || typeof modesJson !== 'object') {
        throw new Error('Invalid modes.json structure');
      }
      
      if (!Array.isArray(modesJson.modes)) {
        throw new Error('Modes must be an array');
      }
      
      // Store activities globally for easy access
      window.ACTIVITIES = activitiesJson || { modes: {}, quickWins: [] };
      
      // Validate and merge modes with comprehensive activities
      const validModes = modesJson.modes.map(mode => {
        if (!mode || typeof mode !== 'object') return null;
        if (!mode.id || typeof mode.id !== 'string') return null;
        if (!mode.title || typeof mode.title !== 'string') return null;
        if (!mode.description || typeof mode.description !== 'string') return null;
        if (!mode.color || typeof mode.color !== 'string') return null;
        
        // Use comprehensive activities from activities.json if available, otherwise fallback to modes.json
        let activities = [];
        if (activitiesJson && activitiesJson.modes && activitiesJson.modes[mode.id]) {
          activities = activitiesJson.modes[mode.id];
          console.log(`[ModesLoader] Loaded ${activities.length} activities for ${mode.id} from activities.json`);
        } else if (Array.isArray(mode.activities)) {
          activities = mode.activities;
          console.log(`[ModesLoader] Using ${activities.length} fallback activities for ${mode.id} from modes.json`);
        } else {
          console.warn(`[ModesLoader] No activities found for ${mode.id}`);
        }
        
        return {
          ...mode,
          activities: activities
        };
      }).filter(mode => mode !== null);
      
      if (validModes.length === 0) {
        throw new Error('No valid modes found');
      }
      
      window.MODES = validModes;
      window.dispatchEvent(new CustomEvent('modes:loaded', { 
        detail: { 
          count: window.MODES.length,
          totalActivities: validModes.reduce((sum, m) => sum + (m.activities?.length || 0), 0),
          quickWinsCount: activitiesJson?.quickWins?.length || 0
        }
      }));
      console.log('[ModesLoader] Modes loaded:', window.MODES.length, 'modes with', 
        validModes.reduce((sum, m) => sum + (m.activities?.length || 0), 0), 'total activities');
    } catch (err){
      console.error('[ModesLoader] Failed to load modes', err);
      // Fallback to empty array
      window.MODES = window.MODES || [];
      window.ACTIVITIES = window.ACTIVITIES || { modes: {}, quickWins: [] };
      window.dispatchEvent(new CustomEvent('modes:loaded', { 
        detail: { 
          count: window.MODES.length, 
          error: err.message 
        }
      }));
    }
  }
  document.addEventListener('DOMContentLoaded', loadModes);
})();
