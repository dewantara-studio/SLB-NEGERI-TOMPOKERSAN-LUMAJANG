/* ==========================================================================
   TUNAS.JS - Tampilan & kontrol percakapan asisten TUNAS.
   Memakai TunasEngine (js/tunas-engine.js) + data/tunas-kb.json.
   Buka/tutup/minimalkan panel ditangani script.js.
   Opsional: bila config.aiEndpoint di tunas-kb.json diisi, pertanyaan yang tidak
   ada di basis pengetahuan diteruskan ke proxy AI milik sekolah (docs/TUNAS-AI.md).
   ========================================================================== */
(function () {
  'use strict';

  const bodyEl = document.getElementById('tunas-body');
  const formEl = document.getElementById('tunas-form');
  const inputEl = document.getElementById('tunas-input');
  const quickEl = document.getElementById('tunas-quick');
  const csEl = document.getElementById('tunas-cs');
  if (!bodyEl || !formEl || !inputEl || !quickEl || !csEl || !window.TunasEngine) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CS_FALLBACK = { name: 'Bu Hesti', wa: '6281333881251' };
  let engine = null, ctx = null, cfg = {}, busy = false;
  const history = [];

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  const wait = (ms) => new Promise((r) => setTimeout(r, prefersReducedMotion ? Math.min(ms, 120) : ms));
  const scrollDown = () => { bodyEl.scrollTop = bodyEl.scrollHeight; };

  function goToSection(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    // Di layar kecil, tutup panel agar bagian yang dituju tidak tertutup.
    if (window.matchMedia('(max-width: 640px)').matches) {
      const closeBtn = document.getElementById('tunas-close');
      if (closeBtn) closeBtn.click();
    }
  }

  function buildAction(a) {
    const csNumber = (cfg && cfg.csWa) || CS_FALLBACK.wa;
    let node;
    if (a.wa || a.href || a.tel) {
      node = el('a', 'tunas-action' + (a.wa ? ' tunas-action--wa' : ''), a.label);
      node.href = a.wa ? waLink(csNumber, a.wa) : a.tel ? 'tel:' + a.tel : a.href;
      if (!a.tel) { node.target = '_blank'; node.rel = 'noopener'; }
    } else {
      node = el('button', 'tunas-action', a.label);
      node.type = 'button';
      node.addEventListener('click', () => goToSection(a.goto));
    }
    return node;
  }

  function addUser(text) {
    bodyEl.appendChild(el('p', 'tunas-msg tunas-msg--user', text));
    scrollDown();
  }
  function addBot(text, actions, note) {
    const wrap = el('div', 'tunas-msg tunas-msg--bot');
    String(text).split(/\n{2,}/).forEach((par) => { if (par.trim()) wrap.appendChild(el('p', null, par.trim())); });
    if (note) wrap.appendChild(el('p', 'tunas-note', note));
    if (actions && actions.length) {
      const box = el('div', 'tunas-actions');
      actions.forEach((a) => box.appendChild(buildAction(a)));
      wrap.appendChild(box);
    }
    bodyEl.appendChild(wrap);
    scrollDown();
  }
  let typingEl = null;
  function showTyping() {
    typingEl = el('div', 'tunas-msg tunas-msg--bot tunas-typing');
    typingEl.setAttribute('aria-hidden', 'true');
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    bodyEl.appendChild(typingEl);
    bodyEl.setAttribute('aria-busy', 'true');
    scrollDown();
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
    bodyEl.setAttribute('aria-busy', 'false');
  }

  function updateCs() {
    const name = (cfg && cfg.csName) || CS_FALLBACK.name;
    const number = (cfg && cfg.csWa) || CS_FALLBACK.wa;
    const message = engine ? engine.csMessage(ctx) : 'Halo ' + name + ', saya menghubungi lewat asisten TUNAS di website SLB Negeri Tompokersan Lumajang.';
    csEl.href = waLink(number, message);
    csEl.lastChild.textContent = ' Hubungi ' + name + ' (CS)';
  }

  function setChips(list) {
    quickEl.innerHTML = '';
    (list || []).forEach((c) => {
      const b = el('button', 'tunas-chip', c.label);
      b.type = 'button';
      b.addEventListener('click', (e) => {
        const opts = {};
        ['entryId', 'age', 'need', 'action'].forEach((k) => { if (c[k]) opts[k] = c[k]; });
        send(c.label, opts);
        if (e.detail === 0) inputEl.focus(); // pengguna keyboard: kembalikan fokus ke kolom ketik
      });
      quickEl.appendChild(b);
    });
  }

  async function askAI(message) {
    if (!cfg.aiEndpoint) return null;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const res = await fetch(cfg.aiEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ message, history: history.slice(-7, -1), context: { age: ctx.age, ageText: ctx.ageText, need: ctx.need } })
      });
      if (!res.ok) throw new Error('AI ' + res.status);
      const data = await res.json();
      return data && typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : null;
    } catch (e) { return null; } finally { clearTimeout(timer); }
  }

  async function send(text, opts) {
    if (busy) return;
    const shown = String(text || '').trim();
    if (!shown) return;
    busy = true;
    setChips([]);
    addUser(shown);
    const isStateChip = opts && (opts.age || opts.need || opts.action);
    if (!isStateChip) ctx.lastQuestion = shown;
    history.push({ role: 'user', content: shown });
    updateCs();
    showTyping();

    let reply = engine.decide(shown, ctx, opts || {});
    let note = null;
    if (reply.type === 'fallback' && cfg.aiEndpoint) {
      const ai = await askAI(shown);
      if (ai) {
        reply = { type: 'ai', text: ai, actions: [{ label: '💬 Tanya ' + (cfg.csName || CS_FALLBACK.name), wa: engine.csMessage(ctx) }], chips: reply.chips };
        note = engine.aiNotice;
      }
    } else {
      await wait(Math.min(450 + String(reply.text).length * 4, 1100));
    }
    hideTyping();
    addBot(reply.text, reply.actions, note);
    history.push({ role: 'assistant', content: reply.text });
    setChips(reply.chips && reply.chips.length ? reply.chips : engine.quickChips());
    updateCs();
    busy = false;
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = inputEl.value.trim();
    if (!value || busy) return;
    inputEl.value = '';
    if (!engine) { addUser(value); addBot('Maaf, aku sedang tidak bisa memuat pengetahuanku. Silakan hubungi ' + CS_FALLBACK.name + ' langsung lewat tombol hijau di bawah.'); return; }
    send(value);
  });

  function init(kb) {
    engine = TunasEngine.createEngine(kb);
    cfg = engine.config;
    ctx = engine.newContext();
    bodyEl.innerHTML = '';
    const g = engine.greeting();
    addBot(g.text, []);
    setChips(g.chips);
    updateCs();
  }

  fetch('data/tunas-kb.json')
    .then((res) => { if (!res.ok) throw new Error('gagal memuat'); return res.json(); })
    .then(init)
    .catch(() => {
      bodyEl.innerHTML = '';
      addBot('Hai! Aku TUNAS 🌱. Saat ini aku belum bisa memuat pengetahuanku, tetapi Bu Hesti siap membantu lewat tombol hijau di bawah.', []);
      updateCs();
    });
})();
