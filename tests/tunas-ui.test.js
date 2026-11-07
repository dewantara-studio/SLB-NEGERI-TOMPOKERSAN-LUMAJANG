// Uji alur percakapan tampilan TUNAS memakai DOM tiruan. Jalankan: node tests/tunas-ui.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Node_ {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.className = ''; this._text = ''; this.scrollTop = 0; this.scrollHeight = 0; this.value = ''; }
  get lastChild() { return this.children[this.children.length - 1]; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((x) => x !== this); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  dispatch(t, ev) { (this.listeners[t] || []).forEach((fn) => fn(Object.assign({ preventDefault() {}, detail: 1 }, ev))); }
  focus() { this.focused = true; }
  click() { this.dispatch('click'); }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(' '); }
  set innerHTML(v) { this.children = []; this._text = ''; }
  get innerHTML() { return ''; }
  walk(fn) { fn(this); this.children.forEach((c) => c.walk(fn)); }
  find(pred) { const out = []; this.walk((n) => { if (pred(n)) out.push(n); }); return out; }
}

const baseKb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/tunas-kb.json'), 'utf8'));
const uiSource = fs.readFileSync(path.join(__dirname, '../js/tunas.js'), 'utf8');

// Memulai halaman baru: elemen baru, konteks baru, tanpa sisa pendengar dari skenario lain.
function boot(configPatch) {
  const registry = {};
  ['tunas-body', 'tunas-form', 'tunas-input', 'tunas-quick', 'tunas-cs'].forEach((id) => { registry[id] = new Node_('div'); });
  const cs = registry['tunas-cs'];
  cs.appendChild(Object.assign(new Node_('span'), { _text: '💬' }));
  cs.appendChild(Object.assign(new Node_('#text'), { _text: ' Hubungi Bu Hesti (CS)' }));
  const kb = JSON.parse(JSON.stringify(baseKb));
  Object.assign(kb.config, configPatch || {});
  const aiCalls = [];
  const sandbox = {
    console, setTimeout, clearTimeout, AbortController, encodeURIComponent,
    document: { getElementById: (id) => registry[id] || null, createElement: (t) => new Node_(t), querySelector: () => null },
    fetch: async (url, opts) => {
      if (String(url).includes('tunas-kb.json')) return { ok: true, json: async () => JSON.parse(JSON.stringify(kb)) };
      aiCalls.push({ url, body: JSON.parse(opts.body) });
      return { ok: true, json: async () => ({ reply: 'Jawaban dari AI uji.' }) };
    }
  };
  sandbox.window = { TunasEngine: require('../js/tunas-engine.js'), matchMedia: (q) => ({ matches: /reduced-motion/.test(q) }) };
  sandbox.TunasEngine = sandbox.window.TunasEngine;
  vm.createContext(sandbox);
  vm.runInContext(uiSource, sandbox);
  return { body: registry['tunas-body'], quick: registry['tunas-quick'], input: registry['tunas-input'], form: registry['tunas-form'], cs, aiCalls };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (label, ok, detail) => { if (ok) pass++; else { fail++; console.log('GAGAL:', label, '->', detail); } };
let body, quick, input, form, cs, aiCalls;
const use = (p) => { ({ body, quick, input, form, cs, aiCalls } = p); };
const msgs = (cls) => body.children.filter((c) => c.className.includes(cls));
const botText = () => (msgs('tunas-msg--bot').filter((m) => !m.className.includes('typing')).pop() || { textContent: '' }).textContent;
const chips = () => quick.children.map((c) => c.textContent.trim());
const ask = async (text) => { input.value = text; form.dispatch('submit'); await sleep(260); };
const tapChip = async (label) => { const c = quick.children.find((x) => x.textContent.trim() === label); if (!c) throw new Error('chip tidak ada: ' + label + ' | ada: ' + chips().join(', ')); c.dispatch('click'); await sleep(260); };

(async () => {
  use(boot());
  await sleep(100);
  check('sapaan awal tampil', /TUNAS/.test(botText()) && /Bu Hesti/.test(botText()), botText());
  check('6 saran awal', quick.children.length === 6, chips().join(' | '));
  check('tombol CS terisi pesan WA', /^https:\/\/wa\.me\/6281333881251\?text=/.test(cs.href) && /TUNAS/.test(decodeURIComponent(cs.href)), cs.href);

  await tapChip('Cara daftar SPMB');
  check('klik saran: pertanyaan + jawaban SPMB', msgs('tunas-msg--user').length === 1 && /100% gratis/.test(botText()), botText().slice(0, 80));
  const acts = body.find((n) => n.className.includes('tunas-action'));
  check('jawaban punya tombol aksi (WA & ke bagian)', acts.some((a) => /wa\.me\/6281333881251/.test(a.href || '')) && acts.some((a) => a.tag === 'button'), acts.map((a) => a.textContent).join(','));
  check('saran lanjutan berganti', chips().length >= 3 && !chips().includes('Cara daftar SPMB'), chips().join(' | '));

  await ask('anak saya sulit mendengar, saya khawatir');
  check('alur orang tua: empati + tanya usia + chip usia', /khawatir/.test(botText()) && /usia/.test(botText()) && chips().includes('7-12 tahun'), botText().slice(0, 100) + ' || ' + chips().join('|'));
  await tapChip('7-12 tahun');
  check('setelah usia: ringkasan SDLB + tunarungu', /SDLB/.test(botText()) && /tunarungu/.test(botText()) && /bukan diagnosis/.test(botText()), botText().slice(0, 100));
  const waAct = body.find((n) => /tunas-action--wa/.test(n.className)).pop();
  check('WA konsultasi memuat usia anak', /7-12 tahun/.test(decodeURIComponent(waAct.href)), decodeURIComponent(waAct.href));
  check('tombol CS ikut memuat info anak', /usia anak 7-12 tahun/.test(decodeURIComponent(cs.href)), decodeURIComponent(cs.href));

  await ask('resep nasi goreng');
  check('di luar topik: arahkan ke Bu Hesti dengan pertanyaan terisi', /Bu Hesti/.test(botText()) && decodeURIComponent(cs.href).includes('resep nasi goreng'), decodeURIComponent(cs.href).slice(-80));

  await ask('saya ingin bunuh diri');
  check('topik keselamatan: nomor bantuan', /112/.test(botText()) && /119/.test(botText()), botText().slice(0, 80));

  const before = msgs('tunas-msg--user').length;
  input.value = '   '; form.dispatch('submit'); await sleep(50);
  check('pesan kosong diabaikan', msgs('tunas-msg--user').length === before, '');

  // jalur AI opsional (halaman baru dengan aiEndpoint terisi)
  use(boot({ aiEndpoint: 'https://contoh.workers.dev/tunas' }));
  await sleep(100);
  await ask('resep nasi goreng');
  check('AI aktif: pertanyaan di luar topik diteruskan ke endpoint', aiCalls.length === 1 && aiCalls[0].body.message === 'resep nasi goreng', JSON.stringify(aiCalls));
  check('AI aktif: jawaban AI + catatan kehati-hatian', /Jawaban dari AI uji/.test(botText()) && /asisten AI/.test(botText()), botText());
  await ask('berapa biaya sekolah');
  check('AI aktif: pertanyaan yang diketahui tetap dijawab lokal (tanpa panggil AI)', aiCalls.length === 1 && /100% gratis/.test(botText()), `panggilan AI: ${aiCalls.length}`);

  console.log(`\nSelesai: ${pass} lulus, ${fail} gagal.`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR UJI:', e.message); process.exit(1); });
