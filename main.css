:root{
  --bg: #F7FBF8;
  --brand-green: #0B3D2E;
  --card-bg: #ffffff;
  --accent: #007BFF;
  --muted-text: #5b6b60;
  --radius: 12px;
  --shadow: 0 8px 22px rgba(6,20,12,0.06);
  --modal-bg: rgba(8,10,12,0.6);
}

/* SECURITY: disable all CSS animations and transitions for stability */
*,
*::before,
*::after { animation: none !important; transition: none !important; }

/* Reset */
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;padding:0;background:var(--bg);color:var(--brand-green);
  font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
}

/* App root & layout */
.app-root{min-height:100vh}

/* Mode page header refinements (v128) */
.mode-page { position:relative; overflow:visible; }
.mode-page::before {
  content: ""; display:block; height:10px; border-top-left-radius:14px; border-top-right-radius:14px;
  margin:-20px -20px 14px; opacity:0.98;
}
.mode-header { display:flex; align-items:center; gap:14px; margin-bottom:12px; padding-top:6px; }
.mode-icon {
  width:64px; height:64px; border-radius:14px; flex:0 0 64px; display:flex; align-items:center; justify-content:center;
  font-size:28px; font-weight:900; box-shadow: 0 6px 18px rgba(6,20,12,0.06);
}

/* stronger title & tip contrast */
.mode-title { margin:0; font-size:1.6rem; font-weight:900; color:var(--mode-text, var(--brand-green)); }
.mode-tip { background:rgba(11,61,46,0.04); padding:12px; border-radius:12px; margin:12px 0; color:var(--muted-text); font-weight:700; }

/* Mode theme accents (v128) */
.app-root.theme-growing .mode-page::before { background: linear-gradient(90deg,#2FA0FF,#007BFF); box-shadow: 0 6px 16px rgba(2,56,120,0.04); }
.app-root.theme-growing .mode-page .mode-icon { background: linear-gradient(180deg,#2FA0FF,#007BFF); color:#fff; }

.app-root.theme-grounded .mode-page::before { background: linear-gradient(90deg,#79D18E,#2e8b57); }
.app-root.theme-grounded .mode-page .mode-icon { background: linear-gradient(180deg,#79D18E,#2e8b57); color:#fff; }

.app-root.theme-drifting .mode-page::before { background: linear-gradient(90deg,#FFD166,#D6A520); }
.app-root.theme-drifting .mode-page .mode-icon { background: linear-gradient(180deg,#FFD166,#D6A520); color:#382B10; }

.app-root.theme-surviving .mode-page::before { background: linear-gradient(90deg,#F08F91,#D9534F); }
.app-root.theme-surviving .mode-page .mode-icon { background: linear-gradient(180deg,#F08F91,#D9534F); color:#fff; }

.app-root.theme-quick .mode-page::before { background: linear-gradient(90deg,#C1B3FF,#6f42c1); }
.app-root.theme-quick .mode-page .mode-icon { background: linear-gradient(180deg,#C1B3FF,#6f42c1); color:#fff; }

/* Core layout & components */
.hero{display:flex;align-items:center;gap:12px;max-width:980px;margin:18px auto;padding:8px 18px}
.hero-icon{width:64px;height:64px;border-radius:10px;object-fit:contain}
.hero-title{margin:0;font-size:1.25rem;font-weight:800}
.hero-sub{margin:2px 0 0;color:var(--muted-text);font-weight:500}
.site-nav{position:sticky;top:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:8px 6px;background:var(--brand-green);color:#fff}
.nav-links{display:flex;gap:16px;list-style:none;margin:0;padding:0;flex-wrap:nowrap;overflow-x:auto}
.nav-links a{color:#fff;text-decoration:none;font-weight:800;padding:6px 8px;border-radius:6px;font-size:0.95rem;white-space:nowrap}
.page{max-width:980px;margin:6px auto;padding:0 16px 120px}
.card{background:var(--card-bg);border-radius:var(--radius);padding:18px;border:1px solid rgba(11,61,46,0.04);box-shadow:var(--shadow);margin-bottom:18px}
.compass-wrap{display:flex;justify-content:center;margin:8px 0 18px;position:relative}
svg{width:360px;height:360px;max-width:92vw;display:block}
.wedge{cursor:pointer;pointer-events:auto;transform-origin:100px 100px}
.compass-label{font-size:20px;font-weight:900;fill:#fff;text-anchor:middle;dominant-baseline:middle;pointer-events:none}
.buttons{margin:6px 0 22px;display:flex;flex-direction:column;gap:12px;align-items:center}
.mode-button{width:92%;max-width:720px;padding:10px 12px;border-radius:10px;border:none;color:white;font-weight:900;text-align:left;display:flex;align-items:center;cursor:pointer}
.mode-button .btn-content{display:flex;flex-direction:column;align-items:flex-start}
.mode-button .btn-title{font-size:1.02rem;line-height:1}
.mode-button .btn-desc{font-size:0.86rem;color:rgba(255,255,255,0.96);font-weight:600;margin-top:6px;opacity:0.95}
.mode-button.growing{background:linear-gradient(180deg,#2fa0ff,#007BFF)}
.mode-button.grounded{background:linear-gradient(180deg,#48b174,#2e8b57)}
.mode-button.drifting{background:linear-gradient(180deg,#f0c95f,#d6a520);color:#2e2a1e}
.mode-button.surviving{background:linear-gradient(180deg,#f08f91,#d9534f)}
.content-area{margin-top:6px;padding-bottom:48px}
.mode-page{background:var(--card-bg);border-radius:14px;padding:20px;border:1px solid rgba(0,0,0,0.04);box-shadow:var(--shadow);margin:14px 0 40px;max-width:760px;margin-left:auto;margin-right:auto}
.mode-page h2{margin:0 0 8px 0;font-size:1.5rem;color:var(--brand-green)}
.mode-desc{color:var(--muted-text);margin-bottom:12px;font-weight:600}
.mode-tip{background:rgba(11,61,46,0.03);padding:10px;border-radius:10px;margin-bottom:14px;color:var(--muted-text);font-weight:600;border-left:4px solid rgba(11,61,46,0.08)}
.quick-list{display:block}
.quick-card{background:#fff;border-radius:12px;padding:14px;margin:12px 0;border:1px solid rgba(0,0,0,0.04);display:flex;align-items:flex-start;gap:12px}
.activity-row{display:block;margin:10px 0;padding:14px;border-radius:10px;background:#fff;border-left:6px solid rgba(11,61,46,0.02)}
.activity-label{font-weight:700;margin-top:6px}
.btn-complete{background:var(--brand-green);color:#fff;border:none;padding:10px 12px;border-radius:10px;font-weight:800;cursor:pointer}
.return-button{display:inline-block;margin-top:14px;padding:12px 18px;background:var(--brand-green);color:white;border-radius:12px;border:none;font-weight:800;cursor:pointer}

/* Modal & session helpers (already defined above) */
.modal { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:var(--modal-bg); z-index:140000; }
.modal[hidden]{ display:none; }
.modal-panel { width:92%; max-width:720px; background:#fff; border-radius:14px; box-shadow:0 18px 46px rgba(2,6,10,0.36); padding:16px; outline:none; }
.modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.modal-body { max-height:56vh; overflow:auto; padding:6px 4px; }
.modal-controls { display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
.timer { display:flex; gap:12px; align-items:center; margin-top:10px; }
.timer-display { font-size:1.6rem; font-weight:900; color:var(--brand-green); background:rgba(0,0,0,0.03); padding:8px 12px; border-radius:10px; min-width:88px; text-align:center; }
.step-list { margin-top:10px; display:flex; flex-direction:column; gap:10px; }
.step-item { background:#fff; padding:12px; border-radius:10px; border:1px solid rgba(0,0,0,0.04); display:flex; gap:12px; align-items:flex-start; }
.helper{font-size:0.95rem;color:var(--muted-text);margin-top:8px}

@media (max-width:420px){ svg{width:300px;height:300px} .compass-label{font-size:16px} .mode-button{font-size:0.95rem;padding:10px} .nav-links a{font-size:0.9rem;padding:6px 6px} .hero-title{font-size:1.1rem} .mode-title{font-size:1.3rem} .mode-icon{width:48px;height:48px;border-radius:12px;font-size:20px} }