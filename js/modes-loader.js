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
    const container = el('div',{class:'mode-card', 'data-mode':mode.id});
    const title = el('div',{class:'mode-title'}, mode.title);
    const desc = el('div',{class:'lead'}, mode.description);
    const actList = el('div',{class:'mode-activities'});

    mode.activities.forEach(act=>{
      const cb = el('input', {type:'checkbox', id:`act-${mode.id}-${act.id}`, value:act.id});
      const icon = el('img',{src:act.icon, alt:'', width:40, height:40, style:'border-radius:8px;'});
      const label = el('label',{for:`act-${mode.id}-${act.id}`, class:'activity-label'}, 
        el('div',{class:'activity-inner', style:'display:flex;align-items:center;gap:10px;'},
          cb,
          el('div',{}, icon),
          el('div',{},
             el('div',{style:'font-weight:600'}, act.title),
             el('div',{class:'explain'}, act.explain)
          )
        )
      );

      // wrap to clickable row
      const activityRow = el('div',{class:'activity', tabIndex:0});
      activityRow.appendChild(label);

      // toggle checkbox when row clicked
      activityRow.addEventListener('click', (e)=>{
        if(e.target.tagName === 'INPUT') return;
        cb.checked = !cb.checked;
        activityRow.classList.toggle('selected', cb.checked);
      });
      cb.addEventListener('change', ()=> activityRow.classList.toggle('selected', cb.checked));

      actList.appendChild(activityRow);
    });

    const btn = el('button',{class:'btn', style:'margin-top:8px;'}, 'Complete Selected');
    btn.addEventListener('click', ()=> {
      const checked = [...actList.querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
      if(!checked.length){ alert('Pick one or more activities to complete.'); return; }
      saveCompletion(mode.id, checked);
      // small reward
      btn.textContent = 'Saved ✓';
      setTimeout(()=> btn.textContent = 'Complete Selected', 1200);
    });

    container.appendChild(title);
    container.appendChild(desc);
    container.appendChild(actList);
    container.appendChild(btn);
    return container;
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
    let root = document.getElementById('modes-root');
    if(!root){
      root = document.createElement('div');
      root.id = 'modes-root';
      const main = document.querySelector('.main-content') || document.body;
      main.appendChild(root);
    }
    root.innerHTML = '';
    const grid = el('div',{class:'mode-grid'});
    modes.forEach(m=> grid.appendChild(formatModeCard(m)));
    root.appendChild(grid);
  }

  document.addEventListener('modes:loaded', (e)=>{
    const modes = window.MODES || [];
    renderModes(modes);
  });

  // If modes were loaded before this script
  if(window.MODES && window.MODES.length) renderModes(window.MODES);

})();
