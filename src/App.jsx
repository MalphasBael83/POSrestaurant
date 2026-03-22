import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qkbuwavtxqpjfmksozls.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYnV3YXZ0eHFwamZta3NvemxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTU1MDksImV4cCI6MjA4OTY5MTUwOX0.rRd2s-tSm1664o3VDOHE-Lvj0uW2Srr5s25P5OYn7Bg";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function tijdLabel(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
function dagTotaal(payments) {
  const nu = new Date();
  return payments
    .filter((p) => {
      const d = new Date(p.timestamp);
      return d.getDate()===nu.getDate() && d.getMonth()===nu.getMonth() && d.getFullYear()===nu.getFullYear();
    })
    .reduce((s, p) => s + Number(p.totaal), 0);
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function unlockAudio() { try { getAudio(); } catch(e) {} }

function speelKeukenGeluid() {
  try {
    const ctx = getAudio();
    [880, 1100].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
  } catch(e) {}
}

function speelOberGeluid() {
  try {
    const ctx = getAudio();
    [523, 659, 784].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "triangle"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t); o.stop(t + 0.45);
    });
  } catch(e) {}
}

function speelRoepOberGeluid() {
  try {
    const ctx = getAudio();
    // Klassiek restaurantbelletje: drie snelle hoge tonen
    [1200, 1400, 1200, 1600].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.28);
    });
  } catch(e) {}
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red:#FF4757; --orange:#FF6B35; --yellow:#FFD93D;
    --green:#6BCB77; --blue:#4D96FF; --purple:#C77DFF;
    --dark:#1a1a2e; --card:#fff; --bg:#FFF8F0;
    --text:#2d2d2d; --muted:#888; --radius:20px;
    --shadow:0 4px 20px rgba(0,0,0,0.12);
  }
  body { font-family:'Nunito',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden; }
  h1,h2,h3 { font-family:'Fredoka One',cursive; letter-spacing:.5px; }
  .app { min-height:100vh; display:flex; flex-direction:column; }

  .topbar { background:var(--dark); color:white; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; box-shadow:0 2px 12px rgba(0,0,0,.3); }
  .topbar h1 { font-size:1.4rem; color:var(--yellow); }
  .topbar-rol { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); color:white; padding:6px 14px; border-radius:50px; font-size:.85rem; font-weight:700; cursor:pointer; font-family:'Nunito',sans-serif; }
  .conn-dot { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px; }
  .conn-dot.ok { background:var(--green); }
  .conn-dot.err { background:var(--red); }
  .conn-dot.wait { background:var(--yellow); }

  .home { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:20px; background:linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%); min-height:100vh; }
  .home-title { color:var(--yellow); font-size:2.8rem; text-align:center; }
  .home-sub { color:rgba(255,255,255,.7); font-size:1rem; text-align:center; margin-top:-10px; }
  .home-emoji { font-size:4rem; margin-bottom:10px; }
  .role-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; width:100%; max-width:340px; margin-top:20px; }
  .role-card { background:linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%); border:2px solid rgba(255,255,255,.2); border-radius:var(--radius); padding:28px 16px; text-align:center; cursor:pointer; transition:all .2s; color:white; }
  .role-card:hover,.role-card:active { transform:scale(1.05); border-color:var(--yellow); background:linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%); }
  .role-card .icon { font-size:2.4rem; margin-bottom:10px; }
  .role-card .label { font-family:'Fredoka One',cursive; font-size:1.1rem; }
  .role-card.ober { border-color:rgba(77,150,255,.4); }
  .role-card.keuken { border-color:rgba(255,71,87,.4); }
  .role-card.eigenaar { border-color:rgba(107,203,119,.4); }
  .role-card.afrekenen { border-color:rgba(199,125,255,.4); }
  .role-card.dashboard { border-color:rgba(255,217,61,.4); grid-column:1/-1; }

  .content { flex:1; padding:16px; max-width:480px; margin:0 auto; width:100%; }
  .card { background:var(--card); border-radius:var(--radius); padding:18px; box-shadow:var(--shadow); margin-bottom:14px; }
  .card-title { font-size:1.1rem; margin-bottom:12px; color:var(--dark); }

  .tables-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .table-btn { aspect-ratio:1; border:3px solid transparent; border-radius:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; font-family:'Fredoka One',cursive; font-size:1.5rem; transition:all .2s; }
  .table-btn .t-label { font-size:.65rem; font-family:'Nunito',sans-serif; font-weight:700; margin-top:4px; text-transform:uppercase; letter-spacing:.5px; }
  .table-btn.vrij { background:#f0fff4; border-color:var(--green); color:#2d7a3a; }
  .table-btn.bezet { background:#fff5f5; border-color:var(--red); color:#c0392b; }
  .table-btn:hover { transform:scale(1.06); }
  .table-btn.selected { box-shadow:0 0 0 4px var(--blue); }

  .categorie-tabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:14px; scrollbar-width:none; }
  .categorie-tabs::-webkit-scrollbar { display:none; }
  .tab-btn { flex-shrink:0; padding:7px 16px; border-radius:50px; border:2px solid #e0e0e0; background:white; font-weight:700; font-size:.8rem; cursor:pointer; font-family:'Nunito',sans-serif; transition:all .2s; color:var(--muted); }
  .tab-btn.active { background:var(--dark); border-color:var(--dark); color:white; }
  .menu-list { display:flex; flex-direction:column; gap:8px; }
  .menu-item { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#fafafa; border-radius:14px; border:2px solid #f0f0f0; }
  .menu-item-name { font-weight:700; font-size:.95rem; }
  .menu-item-price { color:var(--orange); font-weight:800; font-size:.9rem; }
  .qty-ctrl { display:flex; align-items:center; gap:10px; }
  .qty-btn { width:32px; height:32px; border-radius:50%; border:none; font-size:1.2rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .qty-btn.plus { background:var(--blue); color:white; }
  .qty-btn.min { background:#f0f0f0; color:var(--dark); }
  .qty-num { font-weight:800; min-width:20px; text-align:center; }

  .order-summary { background:var(--dark); border-radius:var(--radius); padding:16px; color:white; margin-bottom:14px; }
  .order-summary h3 { color:var(--yellow); margin-bottom:10px; }
  .order-row { display:flex; justify-content:space-between; font-size:.88rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,.1); }
  .order-totaal { display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem; margin-top:10px; color:var(--yellow); }

  .btn { width:100%; padding:16px; border:none; border-radius:var(--radius); font-family:'Fredoka One',cursive; font-size:1.15rem; cursor:pointer; transition:all .2s; letter-spacing:.5px; }
  .btn:hover { transform:translateY(-2px); }
  .btn:active { transform:scale(.98); }
  .btn-primary { background:var(--blue); color:white; box-shadow:0 4px 14px rgba(77,150,255,.4); }
  .btn-success { background:var(--green); color:white; box-shadow:0 4px 14px rgba(107,203,119,.4); }
  .btn-orange { background:var(--orange); color:white; }
  .btn-dark { background:var(--dark); color:white; }
  .btn-sm { padding:8px 16px; font-size:.85rem; width:auto; border-radius:12px; }
  .btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }

  .keuken-order { border-left:5px solid var(--red); padding-left:12px; margin-bottom:14px; }
  .keuken-order.bezig { border-color:var(--orange); }
  .keuken-order.klaar { border-color:var(--green); opacity:.6; }
  .keuken-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
  .keuken-tafel { font-family:'Fredoka One',cursive; font-size:1.1rem; }
  .status-badge { padding:4px 12px; border-radius:50px; font-size:.75rem; font-weight:800; text-transform:uppercase; }
  .badge-nieuw { background:#ffe0e0; color:#c0392b; }
  .badge-bezig { background:#fff3cd; color:#856404; }
  .badge-klaar { background:#d4edda; color:#155724; }
  .keuken-item { font-size:.9rem; padding:3px 0; }
  .keuken-tijd { font-size:.75rem; color:var(--muted); margin-top:4px; }

  .menu-edit-row { display:flex; align-items:center; gap:8px; padding:10px 0; border-bottom:1px solid #f0f0f0; }
  .menu-edit-row:last-child { border:none; }
  .edit-name { flex:1; font-weight:700; font-size:.9rem; }
  .price-input { width:70px; padding:6px 8px; border:2px solid #e0e0e0; border-radius:10px; font-weight:800; font-family:'Nunito',sans-serif; font-size:.9rem; text-align:right; color:var(--orange); }
  .price-input:focus { outline:none; border-color:var(--blue); }

  .bon-title { text-align:center; font-size:1.5rem; color:var(--dark); margin-bottom:6px; }
  .bon-sub { text-align:center; font-size:.85rem; color:var(--muted); margin-bottom:16px; }
  .bon-row { display:flex; justify-content:space-between; font-size:.9rem; padding:5px 0; }
  .bon-divider { border:none; border-top:2px dashed #e0e0e0; margin:10px 0; }
  .bon-totaal { display:flex; justify-content:space-between; font-size:1.2rem; font-weight:800; }

  /* PIN */
  .pin-overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
  .pin-terminal { background:#16213e; border-radius:28px; padding:28px 24px; width:100%; max-width:320px; box-shadow:0 20px 60px rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.1); }
  .pin-bank { text-align:center; color:rgba(255,255,255,.35); font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-bottom:20px; }
  .pin-amount { text-align:center; color:white; font-family:'Fredoka One',cursive; font-size:2.4rem; margin-bottom:4px; }
  .pin-hint { text-align:center; color:rgba(255,255,255,.45); font-size:.8rem; margin-bottom:22px; }
  .pin-display { display:flex; justify-content:center; gap:16px; margin-bottom:26px; }
  .pin-dot { width:20px; height:20px; border-radius:50%; border:2px solid rgba(255,255,255,.25); transition:all .15s; }
  .pin-dot.filled { background:var(--yellow); border-color:var(--yellow); transform:scale(1.1); }
  .pin-numpad { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .pin-key { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1); color:white; border-radius:16px; padding:18px 0; font-family:'Fredoka One',cursive; font-size:1.5rem; cursor:pointer; transition:all .12s; }
  .pin-key:active { transform:scale(.92); background:var(--yellow); color:var(--dark); }
  .pin-key.del { background:rgba(255,71,87,.15); color:var(--red); font-size:1.1rem; }
  .pin-key.empty { background:transparent; border-color:transparent; pointer-events:none; }
  .pin-msg { text-align:center; font-weight:800; font-size:.9rem; margin-top:16px; min-height:22px; }
  .pin-msg.error { color:var(--red); }
  .pin-msg.ok { color:var(--green); }
  .pin-close { background:none; border:1px solid rgba(255,255,255,.15); color:rgba(255,255,255,.4); border-radius:50px; padding:10px 20px; font-family:'Nunito',sans-serif; font-size:.8rem; cursor:pointer; margin-top:14px; width:100%; }

  /* NOTIFICATIE */
  .notif-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:300; padding:24px; }
  @keyframes notif-in { 0%{transform:scale(.7) translateY(30px);opacity:0} 70%{transform:scale(1.05) translateY(-4px)} 100%{transform:scale(1) translateY(0);opacity:1} }
  .notif-box { border-radius:28px; padding:32px 28px; width:100%; max-width:320px; text-align:center; animation:notif-in .4s cubic-bezier(.34,1.56,.64,1); box-shadow:0 24px 60px rgba(0,0,0,.4); }
  .notif-box.keuken { background:linear-gradient(135deg,#1a1a2e,#c0392b); color:white; }
  .notif-box.ober { background:linear-gradient(135deg,#1a3a1a,#155724); color:white; }
  .notif-box.roep { background:linear-gradient(135deg,#7b2ff7,#4a0e8f); color:white; }
  .notif-emoji { font-size:4rem; margin-bottom:12px; display:block; }
  .notif-title { font-family:'Fredoka One',cursive; font-size:1.8rem; margin-bottom:8px; }
  .notif-sub { font-size:.9rem; opacity:.75; margin-bottom:6px; }
  .notif-items { margin:14px 0; background:rgba(255,255,255,.1); border-radius:14px; padding:12px 16px; text-align:left; }
  .notif-item { font-size:.9rem; padding:3px 0; opacity:.9; }
  .notif-btn { margin-top:20px; width:100%; padding:14px; border:none; border-radius:16px; background:rgba(255,255,255,.2); color:white; font-family:'Fredoka One',cursive; font-size:1.1rem; cursor:pointer; }
  .notif-btn:hover { background:rgba(255,255,255,.3); }
  @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
  .notif-pulse { position:relative; display:inline-block; }
  .notif-pulse::before { content:''; position:absolute; inset:-8px; border-radius:50%; background:rgba(255,255,255,.3); animation:pulse-ring 1.2s ease-out infinite; }

  /* DASHBOARD */
  .dash-hero { background:linear-gradient(135deg,#1a1a2e,#0f3460); border-radius:var(--radius); padding:30px 20px; margin-bottom:14px; text-align:center; color:white; box-shadow:var(--shadow); }
  .dash-dag-label { font-size:.75rem; color:rgba(255,255,255,.45); text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
  .dash-dag-bedrag { font-family:'Fredoka One',cursive; font-size:3.5rem; color:var(--yellow); line-height:1; }
  .dash-dag-sub { font-size:.85rem; color:rgba(255,255,255,.45); margin-top:8px; }
  .dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
  .dash-stat { background:white; border-radius:var(--radius); padding:18px 14px; box-shadow:var(--shadow); text-align:center; }
  .dash-stat-num { font-family:'Fredoka One',cursive; font-size:2.2rem; line-height:1; }
  .dash-stat-label { font-size:.72rem; color:var(--muted); font-weight:800; text-transform:uppercase; margin-top:4px; }
  .dash-stat.blue .dash-stat-num { color:var(--blue); }
  .dash-stat.green .dash-stat-num { color:var(--green); }
  .dash-stat.orange .dash-stat-num { color:var(--orange); }
  .dash-stat.purple .dash-stat-num { color:var(--purple); }
  .payment-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f5f5f5; }
  .payment-row:last-child { border:none; }
  .payment-tafel { font-weight:700; font-size:.9rem; }
  .payment-tijd { font-size:.75rem; color:var(--muted); margin-top:2px; }
  .payment-bedrag { font-weight:800; color:var(--green); }

  .betaald-msg { text-align:center; padding:40px 20px; }
  .betaald-msg .check { font-size:4.5rem; }
  .betaald-msg h2 { font-size:1.8rem; margin-top:12px; }
  .betaald-msg p { color:var(--muted); margin-top:8px; }
  .empty { text-align:center; padding:40px 20px; color:var(--muted); }
  .empty .icon { font-size:3rem; margin-bottom:10px; }
  .tafel-tag { display:inline-flex; align-items:center; gap:6px; background:var(--dark); color:var(--yellow); padding:6px 14px; border-radius:50px; font-weight:800; font-size:.85rem; margin-bottom:14px; cursor:pointer; }
  .bottom-nav { position:fixed; bottom:0; left:0; right:0; background:var(--dark); display:flex; padding:10px 0 env(safe-area-inset-bottom,10px); z-index:100; }
  .nav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; color:rgba(255,255,255,.4); cursor:pointer; padding:6px 0; border:none; background:none; font-family:'Nunito',sans-serif; }
  .nav-item.active { color:var(--yellow); }
  .nav-item .nav-icon { font-size:1.4rem; }
  .nav-item .nav-label { font-size:.6rem; font-weight:800; text-transform:uppercase; }
  .nav-badge { position:absolute; top:-4px; right:-6px; background:var(--red); color:white; border-radius:50%; width:18px; height:18px; font-size:.7rem; font-weight:800; display:flex; align-items:center; justify-content:center; }
  .nav-icon-wrap { position:relative; }
  .pb { padding-bottom:80px; }
  .loading { display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Fredoka One',cursive; font-size:1.5rem; color:var(--muted); flex-direction:column; gap:16px; }
  .spinner { width:40px; height:40px; border:4px solid #eee; border-top-color:var(--blue); border-radius:50%; animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes pop { 0%{transform:scale(.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  .pop { animation:pop .25s ease-out; }
  @keyframes slideup { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
  .slideup { animation:slideup .3s ease-out; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 60%{transform:translateX(10px)} }
  .shake { animation:shake .35s ease; }
`;

// ─── NOTIFICATIE POPUP ────────────────────────────────────────────────────────
function NotifPopup({ notif, onClose }) {
  if (!notif) return null;
  const isKeuken = notif.type === "keuken";
  const isRoep = notif.type === "roep_ober";
  const klasse = isKeuken ? "keuken" : isRoep ? "roep" : "ober";
  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className={`notif-box ${klasse}`} onClick={e => e.stopPropagation()}>
        <span className="notif-emoji"><span className="notif-pulse">{isKeuken ? "🔔" : isRoep ? "🛎️" : "✅"}</span></span>
        <div className="notif-title">{notif.titel}</div>
        <div className="notif-sub">{notif.sub}</div>
        {notif.items?.length > 0 && (
          <div className="notif-items">
            {notif.items.map((it, i) => <div key={i} className="notif-item">• {it}</div>)}
          </div>
        )}
        <button className="notif-btn" onClick={onClose}>
          {isKeuken ? "👨‍🍳 Aan de slag!" : isRoep ? "🏃 Ik kom eraan!" : "👍 Begrepen!"}
        </button>
      </div>
    </div>
  );
}

// ─── PIN TERMINAL ─────────────────────────────────────────────────────────────
function PinTerminal({ totaal, correctPin, onSuccess, onClose }) {
  const [invoer, setInvoer] = useState("");
  const [status, setStatus] = useState("idle");
  const [shake, setShake] = useState(false);

  function drukOp(c) {
    if (status === "ok" || invoer.length >= 4) return;
    const nieuw = invoer + c;
    setInvoer(nieuw); setStatus("idle");
    if (nieuw.length === 4) {
      setTimeout(() => {
        if (nieuw === correctPin) { setStatus("ok"); setTimeout(onSuccess, 1400); }
        else { setStatus("error"); setShake(true); setTimeout(() => { setInvoer(""); setShake(false); }, 600); }
      }, 200);
    }
  }

  return (
    <div className="pin-overlay">
      <div className={`pin-terminal ${shake ? "shake" : ""}`}>
        <div className="pin-bank">🏦 Resto Junior Bank</div>
        <div className="pin-amount">€ {Number(totaal).toFixed(2)}</div>
        <div className="pin-hint">{status === "ok" ? "Betaling geaccepteerd!" : "Voer uw pincode in"}</div>
        <div className="pin-display">
          {[0,1,2,3].map(i => <div key={i} className={`pin-dot ${invoer.length > i ? "filled" : ""}`} />)}
        </div>
        <div className="pin-numpad">
          {["1","2","3","4","5","6","7","8","9"].map(k => (
            <button key={k} className="pin-key" onClick={() => drukOp(k)}>{k}</button>
          ))}
          <button className="pin-key empty" />
          <button className="pin-key" onClick={() => drukOp("0")}>0</button>
          <button className="pin-key del" onClick={() => { if (status !== "ok") { setInvoer(p => p.slice(0,-1)); setStatus("idle"); } }}>⌫</button>
        </div>
        <div className={`pin-msg ${status}`}>
          {status === "error" && "❌ Onjuiste pincode, probeer opnieuw"}
          {status === "ok" && "✅ Betaling geaccepteerd!"}
        </div>
        {status !== "ok" && <button className="pin-close" onClick={onClose}>Annuleren</button>}
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg width="300" height="300" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
      <circle cx="340" cy="340" r="300" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3"/>
      <circle cx="340" cy="340" r="278" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <circle cx="340" cy="340" r="276" fill="rgba(255,255,255,0.07)"/>
      <path id="topArcH" d="M 80,340 A 260,260 0 0,1 600,340" fill="none"/>
      <text fontFamily="'Georgia', serif" fontSize="28" letterSpacing="10" fill="rgba(255,255,255,0.65)">
        <textPath href="#topArcH" startOffset="50%" textAnchor="middle">✦  R E S T A U R A N T  ✦</textPath>
      </text>
      <path id="botArcH" d="M 80,340 A 260,260 0 0,0 600,340" fill="none"/>
      <text fontFamily="'Georgia', serif" fontSize="28" letterSpacing="10" fill="#FF6B35">
        <textPath href="#botArcH" startOffset="50%" textAnchor="middle">J U N I O R</textPath>
      </text>
      <line x1="130" y1="220" x2="550" y2="220" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
      <line x1="130" y1="460" x2="550" y2="460" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
      <polygon points="340,206 348,220 340,234 332,220" fill="#FF6B35"/>
      <polygon points="340,446 348,460 340,474 332,460" fill="#FF6B35"/>
      <text x="175" y="425" fontFamily="'Georgia', serif" fontSize="220" fontWeight="700" fill="#FF6B35">N</text>
      <text x="358" y="425" fontFamily="'Georgia', serif" fontSize="220" fontWeight="700" fill="#4D96FF">K</text>
      <circle cx="118" cy="340" r="6" fill="#FF6B35" opacity="0.7"/>
      <circle cx="562" cy="340" r="6" fill="#4D96FF" opacity="0.7"/>
    </svg>
  );
}

function Home({ onKiesRol }) {
  return (
    <div className="home" style={{position:"relative", overflow:"hidden"}}>

      {/* Vork links — midden tussen schermrand en knoppen */}
      <svg width="60" height="100%" viewBox="0 0 60 800" xmlns="http://www.w3.org/2000/svg"
        style={{position:"absolute", left:"calc(50% - 250px)", transform:"translateX(-50%)", top:0, height:"100%", opacity:0.3}}>
        <line x1="12" y1="40" x2="12" y2="180" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="30" y1="40" x2="30" y2="180" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="48" y1="40" x2="48" y2="180" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <path d="M12,180 Q12,225 30,238 Q48,225 48,180" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="30" y1="238" x2="30" y2="760" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>

      {/* Mes rechts — midden tussen knoppen en schermrand */}
      <svg width="60" height="100%" viewBox="0 0 60 800" xmlns="http://www.w3.org/2000/svg"
        style={{position:"absolute", right:"calc(50% - 250px)", transform:"translateX(50%)", top:0, height:"100%", opacity:0.3}}>
        <path d="M46,40 Q58,40 58,150 Q58,210 30,228" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="46" y1="40" x2="30" y2="228" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="30" y1="228" x2="30" y2="760" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>

      <Logo />
      <h1 className="home-title" style={{marginTop:-20}}>Resto Junior</h1>
      <p className="home-sub">Kies je rol en aan de slag!</p>
      <div className="role-grid">
        {[
          { rol:"ober", icon:"🤵", label:"Ober" },
          { rol:"keuken", icon:"👨‍🍳", label:"Keuken" },
          { rol:"eigenaar", icon:"👑", label:"Eigenaar" },
          { rol:"afrekenen", icon:"💳", label:"Kassa" },
          { rol:"dashboard", icon:"📊", label:"Dashboard" },
        ].map(({ rol, icon, label }) => (
          <div key={rol} className={`role-card ${rol}`} onClick={() => { unlockAudio(); onKiesRol(rol); }}>
            <div className="icon">{icon}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OBER ─────────────────────────────────────────────────────────────────────
function OberScherm({ tables, menu }) {
  const [tab, setTab] = useState("tafels");
  const [selectedTable, setSelectedTable] = useState(null);
  const [bestelling, setBestelling] = useState({});
  const [actieveCat, setActieveCat] = useState("Alles");
  const [bezig, setBezig] = useState(false);
  const [ingediend, setIngediend] = useState(false);

  const cats = ["Alles", ...new Set(menu.map(m => m.categorie))];
  const gefilterd = actieveCat === "Alles" ? menu : menu.filter(m => m.categorie === actieveCat);

  function kiesItem(item, delta) {
    setBestelling(prev => {
      const nieuw = Math.max(0, (prev[item.id] || 0) + delta);
      if (nieuw === 0) { const { [item.id]: _, ...rest } = prev; return rest; }
      return { ...prev, [item.id]: nieuw };
    });
  }

  async function indienen() {
    if (bezig) return;
    setBezig(true);
    try {
      // 1. Maak order aan
      const { data: order, error: oErr } = await sb
        .from("orders")
        .insert({ tafel_id: selectedTable.id, status: "nieuw" })
        .select().single();
      if (oErr) throw oErr;

      // 2. Voeg order items toe
      const items = Object.entries(bestelling).map(([id, aantal]) => ({
        order_id: order.id,
        menu_item_id: Number(id),
        aantal,
      }));
      const { error: iErr } = await sb.from("order_items").insert(items);
      if (iErr) throw iErr;

      // 3. Zet tafel op bezet
      await sb.from("tables").update({ status: "bezet" }).eq("id", selectedTable.id);

      setBestelling({});
      setIngediend(true);
      setTimeout(() => { setIngediend(false); setTab("tafels"); }, 2000);
    } catch(e) {
      alert("Fout bij indienen: " + e.message);
    }
    setBezig(false);
  }

  const totalItems = Object.values(bestelling).reduce((a,b) => a+b, 0);
  const totaal = Object.entries(bestelling).reduce((sum, [id, aantal]) => {
    const item = menu.find(m => m.id === Number(id));
    return sum + (item?.prijs || 0) * aantal;
  }, 0);

  if (ingediend) return (
    <div className="content">
      <div className="betaald-msg slideup">
        <div className="check">✅</div>
        <h2 style={{color:"var(--green)"}}>Bestelling verzonden!</h2>
        <p>De keuken is op de hoogte</p>
      </div>
    </div>
  );

  return (
    <div className="content pb">
      {tab === "tafels" && (
        <>
          <div className="card slideup">
            <h2 className="card-title">🍽️ Kies een tafel</h2>
            <div className="tables-grid">
              {tables.map(t => (
                <div key={t.id} className={`table-btn ${t.status} ${selectedTable?.id===t.id ? "selected" : ""}`}
                  onClick={() => setSelectedTable(t)}>
                  {t.nummer}
                  <span className="t-label">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
          {selectedTable && (
            <button className="btn btn-primary slideup" onClick={() => setTab("bestellen")}>
              Bestellen voor tafel {selectedTable.nummer} →
            </button>
          )}
        </>
      )}

      {tab === "bestellen" && (
        <>
          <div className="tafel-tag" onClick={() => setTab("tafels")}>← Tafel {selectedTable?.nummer}</div>
          <div className="categorie-tabs">
            {cats.map(c => (
              <button key={c} className={`tab-btn ${actieveCat===c ? "active" : ""}`} onClick={() => setActieveCat(c)}>{c}</button>
            ))}
          </div>
          <div className="card">
            <div className="menu-list">
              {gefilterd.map(item => (
                <div key={item.id} className="menu-item">
                  <div>
                    <div className="menu-item-name">{item.naam}</div>
                    <div className="menu-item-price">€ {Number(item.prijs).toFixed(2)}</div>
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn min" onClick={() => kiesItem(item,-1)}>−</button>
                    <span className="qty-num">{bestelling[item.id] || 0}</span>
                    <button className="qty-btn plus" onClick={() => kiesItem(item,1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalItems > 0 && (
            <div className="order-summary slideup">
              <h3>📋 Jouw bestelling</h3>
              {Object.entries(bestelling).map(([id, aantal]) => {
                const item = menu.find(m => m.id === Number(id));
                return (
                  <div key={id} className="order-row">
                    <span>{aantal}× {item?.naam}</span>
                    <span>€ {(item?.prijs * aantal).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="order-totaal"><span>Totaal</span><span>€ {totaal.toFixed(2)}</span></div>
            </div>
          )}
          <button className="btn btn-success" onClick={indienen} disabled={totalItems===0 || bezig}>
            {bezig ? "Bezig..." : "🍳 Doorgeven aan keuken"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── KEUKEN ───────────────────────────────────────────────────────────────────
function KeukenScherm({ orders, tables }) {
  const actief = orders.filter(o => o.status !== "klaar");
  const klaar = orders.filter(o => o.status === "klaar");
  const [roepBezig, setRoepBezig] = useState(false);

  async function updateStatus(orderId, nieuweStatus) {
    await sb.from("orders").update({ status: nieuweStatus }).eq("id", orderId);
  }

  function roepOber() {
    setRoepBezig(true);
    emitNotif({
      type: "roep_ober",
      titel: "Ober gevraagd!",
      sub: "De keuken heeft je nodig 👋",
      items: [],
    });
    setTimeout(() => setRoepBezig(false), 3000);
  }

  return (
    <div className="content pb">
      {/* Roep ober knop */}
      <button
        className="btn slideup"
        onClick={roepOber}
        disabled={roepBezig}
        style={{
          background: roepBezig
            ? "rgba(255,71,87,0.4)"
            : "linear-gradient(135deg, #FF4757, #c0392b)",
          color: "white",
          marginBottom: 14,
          boxShadow: "0 4px 20px rgba(255,71,87,0.4)",
          fontSize: "1.2rem",
          letterSpacing: 1,
        }}
      >
        {roepBezig ? "✅ Ober opgeroepen!" : "🔔 Roep ober!"}
      </button>

      {actief.length===0 && klaar.length===0 && (
        <div className="empty"><div className="icon">🍳</div><p>Nog geen bestellingen binnen</p></div>
      )}
      {actief.map(order => {
        const tafel = tables.find(t => t.id === order.tafel_id);
        return (
          <div key={order.id} className={`card keuken-order ${order.status} pop`}>
            <div className="keuken-header">
              <span className="keuken-tafel">🍽️ Tafel {tafel?.nummer}</span>
              <span className={`status-badge badge-${order.status}`}>{order.status}</span>
            </div>
            {order.items?.map((it, i) => (
              <div key={i} className="keuken-item">{it.aantal}× {it.naam}</div>
            ))}
            <div className="keuken-tijd">⏱ {tijdLabel(order.timestamp)}</div>
            <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
              {order.status==="nieuw" && <button className="btn btn-orange btn-sm" onClick={() => updateStatus(order.id,"bezig")}>Bezig →</button>}
              {order.status==="bezig" && <button className="btn btn-success btn-sm" onClick={() => updateStatus(order.id,"klaar")}>✅ Klaar!</button>}
            </div>
          </div>
        );
      })}
      {klaar.length > 0 && (
        <>
          <p style={{color:"var(--muted)",fontWeight:700,fontSize:".8rem",marginBottom:"8px"}}>KLAAR</p>
          {klaar.map(order => {
            const tafel = tables.find(t => t.id === order.tafel_id);
            return (
              <div key={order.id} className="card keuken-order klaar">
                <div className="keuken-header">
                  <span className="keuken-tafel">Tafel {tafel?.nummer}</span>
                  <span className="status-badge badge-klaar">klaar</span>
                </div>
                {order.items?.map((it,i) => <div key={i} className="keuken-item">{it.aantal}× {it.naam}</div>)}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── EIGENAAR ─────────────────────────────────────────────────────────────────
const CATEGORIEEN = ["Voorgerecht", "Hoofdgerecht", "Nagerecht", "Drank"];
const CAT_EMOJI = { "Voorgerecht":"🥗", "Hoofdgerecht":"🍽️", "Nagerecht":"🍰", "Drank":"🥤" };

// Zoekt automatisch een passende emoji op basis van de naam
const EMOJI_MAP = [
  // ── VLEES ──
  { woorden:["hamburger","burger","cheeseburger"], emoji:"🍔" },
  { woorden:["hotdog","hot dog","worst","braadworst","knakworst","frankfurter"], emoji:"🌭" },
  { woorden:["kip","chicken","nugget","nuggets","kipvleugel","vleugel","wing","drumstick","popcornkip"], emoji:"🍗" },
  { woorden:["biefstuk","steak","entrecote","ribeye","ossenhaas","haasbiefstuk","varkenshaas"], emoji:"🥩" },
  { woorden:["vlees","vleesschotel"], emoji:"🥩" },
  { woorden:["spek","bacon","pancetta"], emoji:"🥓" },
  { woorden:["schnitzel","karbonade","kotelet","lamsrack","lam","lamskotelet"], emoji:"🍖" },
  { woorden:["kebab","döner","shoarma","shawarma","gyros","kofta"], emoji:"🥙" },
  { woorden:["taco"], emoji:"🌮" },
  { woorden:["burrito","quesadilla","fajita","enchilada"], emoji:"🌯" },
  { woorden:["gehaktbal","gehakt","slavink","fricandel","kroket"], emoji:"🍖" },
  { woorden:["eend","eendenborst","confit"], emoji:"🍖" },
  { woorden:["kalkoen","turkey"], emoji:"🍗" },
  { woorden:["konijn","haas","wild","hert","ree","everzwijn"], emoji:"🍖" },
  // ── VIS & ZEEVRUCHTEN ──
  { woorden:["zalm","salmon","forel","baars","kabeljauw","tilapia","zeebaars","tarbot","heilbot","vis","fish","tonijn","tuna","haring","maatje","ansjovis","sardine"], emoji:"🐟" },
  { woorden:["sushi","sashimi","maki","nigiri","temaki"], emoji:"🍣" },
  { woorden:["garnaal","garnalen","shrimp","prawns"], emoji:"🍤" },
  { woorden:["kreeft","lobster"], emoji:"🦞" },
  { woorden:["krab","crab","surimi","krabstick"], emoji:"🦀" },
  { woorden:["inktvis","calamari","octopus"], emoji:"🦑" },
  { woorden:["mossel","mosselen","oester","oesters"], emoji:"🦪" },
  { woorden:["visstick","fishstick"], emoji:"🐟" },
  // ── PIZZA & PASTA ──
  { woorden:["pizza","margherita","quattro","calzone","pinsa"], emoji:"🍕" },
  { woorden:["pasta","spaghetti","lasagne","macaroni","penne","fusilli","tagliatelle","fettuccine","linguine","rigatoni","gnocchi","ravioli","tortellini","carbonara","bolognese","arrabiata","pesto","alfredo"], emoji:"🍝" },
  { woorden:["noodle","noedel","ramen","udon","soba","vermicelli","mie","bami","pad thai","pho"], emoji:"🍜" },
  { woorden:["risotto"], emoji:"🍚" },
  // ── BROOD & SANDWICHES ──
  { woorden:["brood","toast","bruschetta"], emoji:"🍞" },
  { woorden:["sandwich","boterham","belegd","club"], emoji:"🥪" },
  { woorden:["tosti","grilled cheese","croque","panini"], emoji:"🥪" },
  { woorden:["wrap","tortilla"], emoji:"🌯" },
  { woorden:["bagel"], emoji:"🥯" },
  { woorden:["croissant","brioche"], emoji:"🥐" },
  { woorden:["baguette","stokbrood","ciabatta","focaccia"], emoji:"🥖" },
  { woorden:["pita","pitabrood","naan","chapati","roti"], emoji:"🫓" },
  // ── SNACKS & FRIET ──
  { woorden:["friet","frietjes","patat","frites","pommes","patates"], emoji:"🍟" },
  { woorden:["nachos","chips","tortillachips","popcorn"], emoji:"🍿" },
  { woorden:["bitterballen","bitterbal","borrelplank","sate","satay","saté"], emoji:"🍢" },
  { woorden:["loempia","springroll","dumpling","gyoza","wonton","samosa","empanada"], emoji:"🥟" },
  { woorden:["falafel"], emoji:"🧆" },
  { woorden:["hummus"], emoji:"🫘" },
  { woorden:["tempura"], emoji:"🍤" },
  { woorden:["spareribs","ribben","ribs"], emoji:"🍖" },
  // ── EIEREN & ONTBIJT ──
  { woorden:["ei","eieren","omelet","omelette","roerei","spiegelei","frittata"], emoji:"🍳" },
  { woorden:["pannenkoek","pancake","crêpe","crepe"], emoji:"🥞" },
  { woorden:["wafel","wafels"], emoji:"🧇" },
  { woorden:["granola","muesli","havermout","pap","porridge"], emoji:"🥣" },
  { woorden:["yoghurt","yogurt"], emoji:"🥛" },
  // ── GROENTEN & SALADE ──
  { woorden:["salade","sla","caesar","nicoise","waldorf","coleslaw"], emoji:"🥗" },
  { woorden:["soep","bouillon","bisque","gazpacho","minestrone","tomatensoep","erwtensoep"], emoji:"🍲" },
  { woorden:["stamppot","hutspot","hachee","zuurkool","boerenkool","stoofpot","stoofvlees","ragout","goulash","stew"], emoji:"🍲" },
  { woorden:["ratatouille","roerbak","groenten","groente"], emoji:"🥦" },
  { woorden:["broccoli","bloemkool","spruitjes"], emoji:"🥦" },
  { woorden:["wortel","wortels","carrot"], emoji:"🥕" },
  { woorden:["tomaat","tomaten"], emoji:"🍅" },
  { woorden:["avocado","guacamole"], emoji:"🥑" },
  { woorden:["komkommer"], emoji:"🥒" },
  { woorden:["paprika","peper"], emoji:"🫑" },
  { woorden:["maïs","mais","corn"], emoji:"🌽" },
  { woorden:["champignon","paddenstoel","mushroom","truffle"], emoji:"🍄" },
  { woorden:["ui","uien","sjalot"], emoji:"🧅" },
  { woorden:["knoflook","look"], emoji:"🧄" },
  { woorden:["spinazie","asperge","asperges"], emoji:"🥬" },
  { woorden:["erwten","bonen","linzen"], emoji:"🫘" },
  { woorden:["aardappel","aardappelen","potato","puree","gratin"], emoji:"🥔" },
  // ── RIJST & AZIATISCH ──
  { woorden:["rijst","nasi","basmati","jasmijn"], emoji:"🍚" },
  { woorden:["curry","massaman","tikka","korma","dahl","dal"], emoji:"🍛" },
  { woorden:["bibimbap","kimchi","bento","poke","bowl"], emoji:"🍱" },
  { woorden:["tempeh","tofu"], emoji:"🥢" },
  { woorden:["miso","edamame"], emoji:"🍵" },
  { woorden:["paella","tagine","tajine"], emoji:"🥘" },
  // ── KAAS ──
  { woorden:["kaas","cheese","brie","camembert","gouda","cheddar","mozzarella","parmesan","feta","ricotta","gorgonzola","fondue","raclette"], emoji:"🧀" },
  { woorden:["boter"], emoji:"🧈" },
  // ── NAGERECHT & ZOET ──
  { woorden:["ijs","ijsje","sorbet","gelato","parfait","sundae"], emoji:"🍨" },
  { woorden:["softijs","softijsje"], emoji:"🍦" },
  { woorden:["taart","cake","cheesecake","tiramisu","gebak","tart","tarte"], emoji:"🍰" },
  { woorden:["chocolade","chocolat","choco","fondant","brownie"], emoji:"🍫" },
  { woorden:["koek","cookie","biscuit","speculaas","stroopwafel"], emoji:"🍪" },
  { woorden:["donut","doughnut","churros","beignet"], emoji:"🍩" },
  { woorden:["muffin","cupcake"], emoji:"🧁" },
  { woorden:["pudding","panna cotta","crème brûlée","mousse","custard","profiterole","eclair","soes"], emoji:"🍮" },
  { woorden:["macaron","macaroon","snoep","candy","karamel","caramel","toffee"], emoji:"🍬" },
  { woorden:["lolly"], emoji:"🍭" },
  { woorden:["honing"], emoji:"🍯" },
  { woorden:["jam","confiture"], emoji:"🍓" },
  { woorden:["wafeltje","stroopwafeltje"], emoji:"🧇" },
  // ── FRUIT ──
  { woorden:["fruitsalade","fruit","mixed fruit"], emoji:"🍇" },
  { woorden:["appel","apple"], emoji:"🍎" },
  { woorden:["peer","pear"], emoji:"🍐" },
  { woorden:["banaan","banana"], emoji:"🍌" },
  { woorden:["aardbei","aardbeien","strawberry","framboos","frambozen"], emoji:"🍓" },
  { woorden:["druiven","druif","grape"], emoji:"🍇" },
  { woorden:["mango","papaya","guave","lychee","passievrucht"], emoji:"🥭" },
  { woorden:["ananas","pineapple"], emoji:"🍍" },
  { woorden:["watermeloen","melon","meloen"], emoji:"🍉" },
  { woorden:["kiwi"], emoji:"🥝" },
  { woorden:["citroen","lemon"], emoji:"🍋" },
  { woorden:["sinaasappel","orange","mandarijn","clementine"], emoji:"🍊" },
  { woorden:["kers","kersen","cherry"], emoji:"🍒" },
  { woorden:["perzik","peach","nectarine","pruim","plum"], emoji:"🍑" },
  { woorden:["blauwe bes","bosbes","blueberry"], emoji:"🫐" },
  { woorden:["kokosnoot","kokos","coconut"], emoji:"🥥" },
  // ── NOTEN ──
  { woorden:["noten","noot","amandel","walnoot","cashew","pistache","pinda","hazelnoot","pecan","kastanje"], emoji:"🥜" },
  { woorden:["pindakaas"], emoji:"🥜" },
  // ── KOFFIE & THEE ──
  { woorden:["koffie","coffee","espresso","cappuccino","latte","americano","lungo","macchiato","flat white","cold brew","iced coffee"], emoji:"☕" },
  { woorden:["thee","tea","earl grey","groene thee","kamille","rooibos","chai","matcha"], emoji:"🍵" },
  { woorden:["chocolademelk","warme chocolade","hot chocolate","chocomelk"], emoji:"☕" },
  // ── DRANKEN KOUD ──
  { woorden:["water","spa","mineraalwater","bruiswater"], emoji:"💧" },
  { woorden:["cola","pepsi","fanta","sprite","7up","dr pepper"], emoji:"🥤" },
  { woorden:["frisdrank","soda","sodawater","tonic"], emoji:"🥤" },
  { woorden:["sap","juice","appelsap","sinaasappelsap","jus","vruchtensap","perssap"], emoji:"🧃" },
  { woorden:["melk","halfvolle","magere","karnemelk"], emoji:"🥛" },
  { woorden:["milkshake","shake","frappe"], emoji:"🥤" },
  { woorden:["smoothie"], emoji:"🥤" },
  { woorden:["limonade","siroop"], emoji:"🍋" },
  { woorden:["ijsthee","ice tea","bubble tea","boba"], emoji:"🧋" },
  { woorden:["energydrank","energy drink","red bull","monster"], emoji:"⚡" },
  // ── DRANKEN ALCOHOLISCH ──
  { woorden:["bier","pils","ale","lager","stout","ipa","weizen","tripel","dubbel","witbier","cider"], emoji:"🍺" },
  { woorden:["wijn","wine","rosé","rose","sauvignon","merlot","cabernet","chardonnay","port","sherry","sangria"], emoji:"🍷" },
  { woorden:["prosecco","champagne","cava","mousserende","sparkling"], emoji:"🥂" },
  { woorden:["cocktail","mojito","daiquiri","margarita","cosmopolitan","aperol","spritz"], emoji:"🍹" },
  { woorden:["whisky","whiskey","bourbon","scotch","rum","vodka","gin","tequila","cognac","brandy","jenever","borrel"], emoji:"🥃" },
  { woorden:["sake"], emoji:"🍶" },
  // ── SPECIALE ──
  { woorden:["bbq","barbecue","grill","grillschotel"], emoji:"🔥" },
  { woorden:["vegetarisch","vegan","plantaardig"], emoji:"🌱" },
  { woorden:["dagschotel","dagmenu","dagsuggestie"], emoji:"⭐" },
  { woorden:["kindermenu","kinder","kids"], emoji:"👶" },
  { woorden:["chef","signature","special","speciale"], emoji:"👨‍🍳" },
];

function kiesEmoji(naam) {
  if (!naam || !naam.trim()) return "🍴";
  // Normaliseer: lowercase, verwijder accenten, verwijder leestekens
  const lower = naam.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // accenten weg
    .replace(/[^a-z0-9\s]/g, " "); // leestekens naar spatie
  for (const { woorden, emoji } of EMOJI_MAP) {
    if (woorden.some(w => lower.includes(w.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return emoji;
    }
  }
  return "🍴";
}

function EigenaarScherm({ menu, onMenuUpdate }) {
  const [prices, setPrices] = useState({});
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [toonForm, setToonForm] = useState(false);
  const [nieuw, setNieuw] = useState({ naam:"", prijs:"", categorie:"Hoofdgerecht" });
  const [autoEmoji, setAutoEmoji] = useState("🍴");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState(null);
  const cats = [...new Set([...CATEGORIEEN, ...menu.map(m => m.categorie)])];

  function toonMelding(tekst, ok=true) {
    setMelding({ tekst, ok });
    setTimeout(() => setMelding(null), 2500);
  }

  function handleNaamChange(e) {
    const naam = e.target.value;
    setNieuw(p => ({...p, naam}));
    setAutoEmoji(kiesEmoji(naam));
  }

  async function opslaan() {
    const updates = Object.entries(prices).map(([id, prijs]) =>
      sb.from("menu_items").update({ prijs: parseFloat(prijs) }).eq("id", Number(id))
    );
    await Promise.all(updates);
    onMenuUpdate();
    setPrices({});
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2000);
  }

  async function voegToe() {
    if (!nieuw.naam.trim() || !nieuw.prijs) return;
    setBezig(true);
    const naamMetEmoji = `${autoEmoji} ${nieuw.naam.trim()}`;
    const { error } = await sb.from("menu_items").insert({
      naam: naamMetEmoji,
      prijs: parseFloat(nieuw.prijs),
      categorie: nieuw.categorie,
    });
    if (error) { toonMelding("Fout: " + error.message, false); }
    else {
      onMenuUpdate();
      setNieuw({ naam:"", prijs:"", categorie:"Hoofdgerecht" });
      setAutoEmoji("🍴");
      setToonForm(false);
      toonMelding(`✅ ${naamMetEmoji} toegevoegd!`);
    }
    setBezig(false);
  }

  async function verwijder(item) {
    if (!confirm(`"${item.naam}" verwijderen?`)) return;
    const { error } = await sb.from("menu_items").delete().eq("id", item.id);
    if (error) { toonMelding("Fout: " + error.message, false); }
    else { onMenuUpdate(); toonMelding(`🗑️ ${item.naam} verwijderd`); }
  }

  return (
    <div className="content pb">
      {melding && (
        <div className="card slideup" style={{background: melding.ok?"#d4edda":"#ffe0e0", color: melding.ok?"#155724":"#c0392b", textAlign:"center", fontWeight:700}}>
          {melding.tekst}
        </div>
      )}
      {opgeslagen && !melding && (
        <div className="card slideup" style={{background:"#d4edda",color:"#155724",textAlign:"center",fontWeight:700}}>✅ Prijzen opgeslagen!</div>
      )}

      {/* NIEUW GERECHT TOEVOEGEN */}
      <div className="card slideup">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: toonForm ? 14 : 0}}>
          <h2 className="card-title" style={{marginBottom:0}}>➕ Gerecht toevoegen</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setToonForm(v => !v)}>
            {toonForm ? "Sluiten" : "Nieuw"}
          </button>
        </div>

        {toonForm && (
          <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:4}}>
            {/* Emoji preview + naam input */}
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <div style={{
                width:56, height:56, borderRadius:14, background: autoEmoji === "🍴" ? "#f5f5f5" : "#fff8f0",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"2rem", flexShrink:0,
                border: autoEmoji === "🍴" ? "2px solid #e0e0e0" : "2px solid var(--orange)",
                transition:"all 0.25s",
              }}>
                {autoEmoji}
              </div>
              <input
                placeholder="Naam (bv. Frietjes)"
                value={nieuw.naam}
                onChange={handleNaamChange}
                autoFocus
                style={{padding:"10px 14px", border:"2px solid #e0e0e0", borderRadius:12, fontFamily:"'Nunito',sans-serif", fontSize:"0.95rem", width:"100%", fontWeight:700}}
              />
            </div>
            <div style={{fontSize:"0.72rem", color: autoEmoji === "🍴" ? "var(--muted)" : "var(--orange)", marginTop:-4, fontWeight: autoEmoji === "🍴" ? 400 : 700}}>
              {autoEmoji === "🍴" ? "Typ een naam — emoji verschijnt automatisch" : `${autoEmoji} Herkend! Emoji wordt automatisch toegevoegd`}
            </div>
            <div style={{display:"flex", gap:8}}>
              <div style={{position:"relative", flex:1}}>
                <span style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", fontWeight:700}}>€</span>
                <input
                  type="number" step="0.5" min="0" placeholder="0.00"
                  value={nieuw.prijs}
                  onChange={e => setNieuw(p => ({...p, prijs: e.target.value}))}
                  style={{padding:"10px 14px 10px 28px", border:"2px solid #e0e0e0", borderRadius:12, fontFamily:"'Nunito',sans-serif", fontSize:"0.95rem", width:"100%", fontWeight:800, color:"var(--orange)"}}
                />
              </div>
              <select
                value={nieuw.categorie}
                onChange={e => setNieuw(p => ({...p, categorie: e.target.value}))}
                style={{padding:"10px 12px", border:"2px solid #e0e0e0", borderRadius:12, fontFamily:"'Nunito',sans-serif", fontSize:"0.85rem", fontWeight:700, background:"white", flex:1}}
              >
                {CATEGORIEEN.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
              </select>
            </div>
            <button className="btn btn-success" onClick={voegToe} disabled={bezig || !nieuw.naam.trim() || !nieuw.prijs}>
              {bezig ? "Bezig..." : `${autoEmoji} Toevoegen`}
            </button>
          </div>
        )}
      </div>

      {/* BESTAANDE ITEMS PER CATEGORIE */}
      {cats.map(cat => {
        const items = menu.filter(m => m.categorie===cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="card slideup">
            <h2 className="card-title">{CAT_EMOJI[cat] || "🍴"} {cat}</h2>
            {items.map(item => (
              <div key={item.id} className="menu-edit-row">
                <span className="edit-name">{item.naam}</span>
                <span style={{color:"var(--muted)",fontSize:".8rem"}}>€</span>
                <input className="price-input" type="number" step="0.5" min="0"
                  value={prices[item.id]!==undefined ? prices[item.id] : item.prijs}
                  onChange={e => setPrices(p => ({...p,[item.id]:e.target.value}))} />
                <button
                  onClick={() => verwijder(item)}
                  style={{background:"none", border:"none", cursor:"pointer", fontSize:"1.1rem", padding:"4px", opacity:0.5}}
                  title="Verwijderen"
                >🗑️</button>
              </div>
            ))}
          </div>
        );
      })}

      <button className="btn btn-success" onClick={opslaan} disabled={Object.keys(prices).length===0}>
        💾 Prijzen opslaan
      </button>
    </div>
  );
}

// ─── KASSA ────────────────────────────────────────────────────────────────────
function AfrekeningScherm({ tables, orders, menu }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [fase, setFase] = useState("kies");
  const pinRef = useRef(null);
  const [pinDisplay, setPinDisplay] = useState(null);

  const bezetteTafels = tables.filter(t => t.status==="bezet");
  const tafelOrders = selectedTable ? orders.filter(o => o.tafel_id===selectedTable.id) : [];

  const itemMap = {};
  tafelOrders.forEach(o => {
    o.items?.forEach(({ menu_item_id, naam, aantal }) => {
      if (!itemMap[menu_item_id]) itemMap[menu_item_id] = { naam, prijs: menu.find(m=>m.id===menu_item_id)?.prijs||0, aantal:0 };
      itemMap[menu_item_id].aantal += aantal;
    });
  });
  const bonItems = Object.values(itemMap);
  const totaal = bonItems.reduce((s,{prijs,aantal}) => s + Number(prijs)*aantal, 0);

  function openBon(tafel) {
    const pin = randomPin();
    pinRef.current = pin;
    setPinDisplay(pin);
    setSelectedTable(tafel);
    setFase("bon");
  }

  async function betalingGelukt() {
    await sb.from("tables").update({ status:"vrij" }).eq("id", selectedTable.id);
    await sb.from("payments").insert({
      tafel_id: selectedTable.id,
      tafel_nummer: selectedTable.nummer,
      totaal,
    });
    // Verwijder orders van deze tafel
    const orderIds = tafelOrders.map(o => o.id);
    if (orderIds.length) await sb.from("orders").delete().in("id", orderIds);
    setFase("betaald");
  }

  if (fase==="betaald") return (
    <div className="content">
      <div className="betaald-msg slideup">
        <div className="check">💰</div>
        <h2 style={{color:"var(--green)"}}>Betaald!</h2>
        <p>Tafel {selectedTable?.nummer} is weer vrij</p>
        <br />
        <button className="btn btn-dark" style={{maxWidth:220,margin:"0 auto"}}
          onClick={() => { setSelectedTable(null); setFase("kies"); pinRef.current=null; setPinDisplay(null); }}>
          Volgende tafel
        </button>
      </div>
    </div>
  );

  return (
    <div className="content pb">
      {fase==="pin" && pinRef.current && (
        <PinTerminal totaal={totaal} correctPin={pinRef.current} onSuccess={betalingGelukt} onClose={() => setFase("bon")} />
      )}
      {fase==="kies" && (
        <div className="card slideup">
          <h2 className="card-title">💳 Kies tafel om af te rekenen</h2>
          {bezetteTafels.length===0 ? (
            <div className="empty"><div className="icon">🎉</div><p>Geen bezette tafels</p></div>
          ) : (
            <div className="tables-grid">
              {bezetteTafels.map(t => (
                <div key={t.id} className="table-btn bezet" onClick={() => openBon(t)}>
                  {t.nummer}<span className="t-label">bezet</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {fase==="bon" && selectedTable && (
        <>
          <div className="tafel-tag" onClick={() => setFase("kies")}>← Terug</div>
          <div className="card slideup">
            <h2 className="bon-title">🧾 Rekening</h2>
            <p className="bon-sub">Tafel {selectedTable.nummer}</p>
            {bonItems.length===0 ? (
              <div className="empty"><div className="icon">🍽️</div><p>Geen bestellingen</p></div>
            ) : (
              <>
                {bonItems.map(({naam,prijs,aantal},i) => (
                  <div key={i} className="bon-row">
                    <span>{aantal}× {naam}</span>
                    <span>€ {(Number(prijs)*aantal).toFixed(2)}</span>
                  </div>
                ))}
                <hr className="bon-divider" />
                <div className="bon-totaal"><span>Totaal</span><span>€ {totaal.toFixed(2)}</span></div>
                <br />
                <div style={{background:"#f0f4ff",border:"2px dashed #c0d0ff",borderRadius:16,padding:"14px 18px",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:".7rem",color:"var(--muted)",fontWeight:800,marginBottom:6,textTransform:"uppercase"}}>🔐 Pincode voor de klant</div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"2.5rem",letterSpacing:10,color:"var(--blue)"}}>{pinDisplay}</div>
                  <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:6}}>Geef dit scherm aan de klant</div>
                </div>
                <button className="btn btn-primary" onClick={() => setFase("pin")}>💳 Start pin betaling</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardScherm({ tables, orders, payments }) {
  const totaalVandaag = dagTotaal(payments);
  const bezetteTafels = tables.filter(t => t.status==="bezet").length;
  const openBestellingen = orders.filter(o => o.status!=="klaar").length;

  return (
    <div className="content pb">
      <div className="dash-hero slideup">
        <div className="dash-dag-label">📅 Dagtotaal vandaag</div>
        <div className="dash-dag-bedrag">€ {totaalVandaag.toFixed(2)}</div>
        <div className="dash-dag-sub">{payments.length} {payments.length===1?"betaling":"betalingen"} afgerond</div>
      </div>
      <div className="dash-grid">
        <div className="dash-stat blue"><div className="dash-stat-num">{bezetteTafels}</div><div className="dash-stat-label">Bezette tafels</div></div>
        <div className="dash-stat orange"><div className="dash-stat-num">{openBestellingen}</div><div className="dash-stat-label">Open bestellingen</div></div>
        <div className="dash-stat green"><div className="dash-stat-num">{payments.length}</div><div className="dash-stat-label">Afgerekend</div></div>
        <div className="dash-stat purple"><div className="dash-stat-num">{tables.filter(t=>t.status==="vrij").length}</div><div className="dash-stat-label">Vrije tafels</div></div>
      </div>
      <div className="card slideup">
        <h2 className="card-title">💰 Betalingen vandaag</h2>
        {payments.length===0 ? (
          <div className="empty"><div className="icon">💳</div><p>Nog geen betalingen</p></div>
        ) : (
          [...payments].reverse().map(p => (
            <div key={p.id} className="payment-row">
              <div>
                <div className="payment-tafel">Tafel {p.tafel_nummer}</div>
                <div className="payment-tijd">{tijdLabel(p.timestamp)}</div>
              </div>
              <div className="payment-bedrag">€ {Number(p.totaal).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key:"ober", icon:"🤵", label:"Ober" },
  { key:"keuken", icon:"👨‍🍳", label:"Keuken" },
  { key:"eigenaar", icon:"👑", label:"Eigenaar" },
  { key:"afrekenen", icon:"💳", label:"Kassa" },
  { key:"dashboard", icon:"📊", label:"Dash" },
];

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState("wait");

  // ── Data state ──
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  // ── Notificaties ──
  const [notif, setNotif] = useState(null);
  const [lokaleNotif, setLokaleNotif] = useState(null);
  const prevOrdersRef = useRef([]);

  // ── Initieel laden ──
  async function laadAlles() {
    const [tablesRes, menuRes, ordersRes, paymentsRes] = await Promise.all([
      sb.from("tables").select("*").order("nummer"),
      sb.from("menu_items").select("*").order("id"),
      sb.from("orders").select("*, order_items(id, aantal, menu_item_id, menu_items(naam))").order("timestamp"),
      sb.from("payments").select("*").order("timestamp"),
    ]);
    setTables(tablesRes.data || []);
    setMenu(menuRes.data || []);
    // Verrijk orders met items
    const rijkeOrders = (ordersRes.data || []).map(o => ({
      ...o,
      items: (o.order_items || []).map(it => ({
        menu_item_id: it.menu_item_id,
        naam: it.menu_items?.naam || "?",
        aantal: it.aantal,
      })),
    }));
    setOrders(rijkeOrders);
    prevOrdersRef.current = rijkeOrders;
    setPayments(paymentsRes.data || []);
    setLoading(false);
  }

  useEffect(() => { laadAlles(); }, []);

  // ── Realtime subscriptions ──
  useEffect(() => {
    const channel = sb.channel("restaurant-realtime")

      // ORDERS: nieuwe of gewijzigde status
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async (payload) => {
        // Herlaad orders met items
        const { data } = await sb
          .from("orders")
          .select("*, order_items(id, aantal, menu_item_id, menu_items(naam))")
          .order("timestamp");
        const rijkeOrders = (data || []).map(o => ({
          ...o,
          items: (o.order_items || []).map(it => ({
            menu_item_id: it.menu_item_id,
            naam: it.menu_items?.naam || "?",
            aantal: it.aantal,
          })),
        }));

        // Detecteer nieuwe orders → keuken popup
        const oudeIds = new Set(prevOrdersRef.current.map(o => o.id));
        const nieuweOrders = rijkeOrders.filter(o => !oudeIds.has(o.id) && o.status === "nieuw");
        if (nieuweOrders.length > 0) {
          const laatste = nieuweOrders[nieuweOrders.length - 1];
          const tafel = tables.find(t => t.id === laatste.tafel_id);
          speelKeukenGeluid();
          setNotif({
            type: "keuken",
            titel: "Nieuwe bestelling!",
            sub: `Tafel ${tafel?.nummer || laatste.tafel_id} heeft besteld`,
            items: laatste.items.map(it => `${it.aantal}× ${it.naam}`),
          });
        }

        // Detecteer orders die op "klaar" zijn gezet → ober popup
        prevOrdersRef.current.forEach(oud => {
          const nieuw = rijkeOrders.find(o => o.id === oud.id);
          if (nieuw && oud.status !== "klaar" && nieuw.status === "klaar") {
            const tafel = tables.find(t => t.id === nieuw.tafel_id);
            speelOberGeluid();
            setNotif({
              type: "ober",
              titel: "Bestelling klaar!",
              sub: `Tafel ${tafel?.nummer || nieuw.tafel_id} kan worden bediend`,
              items: nieuw.items.map(it => `${it.aantal}× ${it.naam}`),
            });
          }
        });

        prevOrdersRef.current = rijkeOrders;
        setOrders(rijkeOrders);
      })

      // TAFELS
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => {
        sb.from("tables").select("*").order("nummer").then(({ data }) => setTables(data || []));
      })

      // MENU ITEMS — realtime toevoegen/wijzigen/verwijderen
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        sb.from("menu_items").select("*").order("id").then(({ data }) => setMenu(data || []));
      })

      // BETALINGEN
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        sb.from("payments").select("*").order("timestamp").then(({ data }) => setPayments(data || []));
      })

      .subscribe(status => {
        setConnected(status === "SUBSCRIBED" ? "ok" : status === "CLOSED" ? "err" : "wait");
      });

    return () => sb.removeChannel(channel);
  }, [tables]); // tables als dep zodat tafelNummer kloppen in notifs

  const nieuweBestellingen = orders.filter(o => o.status==="nieuw").length;

  // Lokale notif listener voor roep_ober
  useEffect(() => {
    return onNotif((n) => {
      if (n.type === "roep_ober") speelRoepOberGeluid();
      setLokaleNotif(n);
    });
  }, []);

  const toonRealtimeNotif = notif && (notif.type==="keuken" ? rol==="keuken" : rol==="ober");
  const toonLokaleNotif = lokaleNotif?.type === "roep_ober" && rol === "ober";
  const rolLabels = { ober:"🤵 Ober", keuken:"👨‍🍳 Keuken", eigenaar:"👑 Eigenaar", afrekenen:"💳 Kassa", dashboard:"📊 Dashboard" };

  if (loading) return (
    <>
      <style>{style}</style>
      <div className="loading">
        <div className="spinner" />
        Verbinden met Supabase...
      </div>
    </>
  );

  return (
    <>
      <style>{style}</style>
      <div className="app">
        {toonRealtimeNotif && <NotifPopup notif={notif} onClose={() => setNotif(null)} />}
        {toonLokaleNotif && <NotifPopup notif={lokaleNotif} onClose={() => setLokaleNotif(null)} />}
        {!rol ? (
          <Home onKiesRol={setRol} />
        ) : (
          <>
            <div className="topbar">
              <h1>
                <span className={`conn-dot ${connected}`} title={connected==="ok"?"verbonden":connected==="err"?"verbroken":"wachten"} />
                🍽️ Resto Junior
              </h1>
              <button className="topbar-rol" onClick={() => setRol(null)}>{rolLabels[rol]} ✕</button>
            </div>

            {rol==="ober" && <OberScherm tables={tables} menu={menu} />}
            {rol==="keuken" && <KeukenScherm orders={orders} tables={tables} />}
            {rol==="eigenaar" && <EigenaarScherm menu={menu} onMenuUpdate={laadAlles} />}
            {rol==="afrekenen" && <AfrekeningScherm tables={tables} orders={orders} menu={menu} />}
            {rol==="dashboard" && <DashboardScherm tables={tables} orders={orders} payments={payments} />}

            <nav className="bottom-nav">
              {NAV_ITEMS.map(({ key, icon, label }) => (
                <button key={key} className={`nav-item ${rol===key?"active":""}`}
                  onClick={() => { unlockAudio(); setRol(key); }}>
                  <div className="nav-icon-wrap">
                    <span className="nav-icon">{icon}</span>
                    {key==="keuken" && nieuweBestellingen>0 && <span className="nav-badge">{nieuweBestellingen}</span>}
                  </div>
                  <span className="nav-label">{label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </>
  );
}
