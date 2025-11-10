// Minimal Modes UI: renders mode cards and multi-select activities.
// Usage: add <div id="modes-root"></div> inside <main> where you want the modes to appear.
// This is intentionally small and plain-language for easy paste & commit.

(function(){
  function el(tag, attrs={}, ...children){
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k === 'class') e.className = v;
      else if(k.startsWith('data-')) e.setAttribute(k, v);
      else if(k === 'style') e.style.cssText = v;
      else e[k] = v;
    });
    children.flat().forEach(ch => {
      if(typeof ch === 'string') e.appendChild(document.createTextNode(ch));
      else if(ch) e.appendChild(ch);
    });
    return e;
  }

  function formatModeCard(mode){
    // Map mode.id to emoji
    const emojiMap = {
      'surviving': '⚡',
      'drifting': '☁️',
      'grounded': '🧘',
      'growing': '🌱'
    };
    
    const btn = el('button',{
      class:'mode-card', 
      'data-mode-id':mode.id,
      style:`--mode-color:${mode.color}`
    });
    
    const emoji = el('div',{class:'mode-emoji'}, emojiMap[mode.id] || '🧭');
    const meta = el('div',{class:'mode-meta'});
    const name = el('div',{class:'mode-name'}, mode.title);
    const desc = el('div',{class:'mode-desc'}, mode.description);
    const hint = el('div',{class:'mode-hint'}, 'Tap to open activities');
    
    meta.appendChild(name);
    meta.appendChild(desc);
    meta.appendChild(hint);
    
    btn.appendChild(emoji);
    btn.appendChild(meta);
    
    return btn;
  }

  function saveCompletion(modeId, activityIds){
    const history = JSON.parse(localStorage.getItem('reset_history')||'[]');
    const entry = {
      id: 'h_'+Date.now(),
      date: new Date().toISOString(),
      mode: modeId,
      activities: activityIds
    };
    history.unshift(entry);
    localStorage.setItem('reset_history', JSON.stringify(history));
    // for quick feedback, dispatch event
    window.dispatchEvent(new CustomEvent('history:updated', {detail: entry}));
  }

  function renderModes(modes){
    let root = document.getElementById('modesGrid');
    if(!root){
      console.warn('modesGrid not found in DOM');
      return;
    }
    root.innerHTML = '';
    modes.forEach(m=> root.appendChild(formatModeCard(m)));
  }

  document.addEventListener('modes:loaded', (e)=>{
    const modes = window.MODES || [];
    renderModes(modes);
  });

  // If modes were loaded before this script
  if(window.MODES && window.MODES.length) renderModes(window.MODES);

})();
