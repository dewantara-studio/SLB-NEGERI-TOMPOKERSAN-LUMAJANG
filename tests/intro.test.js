// Uji pembuka video. Jalankan: node tests/intro.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const introSrc = fs.readFileSync(path.join(__dirname, '../js/intro.js'), 'utf8');
// skrip penentu di <head>: ambil yang memuat 'has-intro'
const decider = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('has-intro'));

let pass = 0, fail = 0;
const check = (label, ok, detail) => { if (ok) pass++; else { fail++; console.log('GAGAL:', label, '->', detail); } };

// ---------- 1) penentu tampil / tidak ----------
function decide({ search = '', seen = false, reduce = false, storageThrows = false }) {
  const cls = new Set();
  const sandbox = {
    URLSearchParams,
    location: { search },
    window: { matchMedia: () => ({ matches: reduce }) },
    document: { documentElement: { classList: { add: (c) => cls.add(c) } } },
    sessionStorage: { getItem: () => { if (storageThrows) throw new Error('x'); return seen ? '1' : null; } }
  };
  sandbox.window.sessionStorage = sandbox.sessionStorage;
  vm.createContext(sandbox);
  vm.runInContext(decider, sandbox);
  return cls.has('has-intro');
}
check('kunjungan pertama -> tampil', decide({}) === true, '');
check('sudah dilihat di sesi ini -> tidak tampil', decide({ seen: true }) === false, '');
check('?intro=1 -> paksa tampil meski sudah dilihat', decide({ search: '?intro=1', seen: true }) === true, '');
check('?intro=0 -> mati', decide({ search: '?intro=0' }) === false, '');
check('kurangi gerakan -> tidak tampil', decide({ reduce: true }) === false, '');
check('kurangi gerakan mengalahkan ?intro=1', decide({ search: '?intro=1', reduce: true }) === false, '');
check('penyimpanan error -> tetap tampil (tidak crash)', decide({ storageThrows: true }) === true, '');

// ---------- 2) perilaku overlay ----------
class El {
  constructor(id) { this.id = id; this.attrs = {}; this.listeners = {}; this.removed = false; this.classes = new Set(); this.text = ''; this.focused = false; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  removeEventListener(t, fn) { this.listeners[t] = (this.listeners[t] || []).filter((f) => f !== fn); }
  emit(t, ev) { (this.listeners[t] || []).slice().forEach((fn) => fn(ev || {})); }
  remove() { this.removed = true; }
  focus() { this.focused = true; }
  get classList() { const s = this.classes; return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c) }; }
  set textContent(v) { this.text = v; } get textContent() { return this.text; }
}

function boot({ active = true, playImpl } = {}) {
  const els = { intro: new El('intro'), 'intro-video': new El('intro-video'), 'intro-skip': new El('intro-skip'), 'intro-sound': new El('intro-sound') };
  const video = els['intro-video'];
  video.muted = false; video.preload = 'none'; video.paused = true; video.pauseCalls = 0; video.playCalls = 0;
  video.pause = () => { video.pauseCalls++; };
  video.play = () => { video.playCalls++; return playImpl ? playImpl() : Promise.resolve(); };
  const rest = [new El('header'), new El('main'), new El('footer')];
  const root = new El('html'); if (active) root.classes.add('has-intro');
  const doc = new El('document');
  doc.documentElement = root; doc.getElementById = (id) => els[id] || null; doc.querySelectorAll = () => rest;

  // penjadwal waktu palsu agar uji tidak menunggu sungguhan
  let now = 0; const timers = [];
  const sandbox = {
    document: doc, sessionStorage: { _s: {}, setItem(k, v) { this._s[k] = v; } },
    setTimeout: (fn, ms) => { const t = { fn, at: now + ms, id: timers.length + 1 }; timers.push(t); return t.id; },
    clearTimeout: (id) => { const t = timers.find((x) => x.id === id); if (t) t.dead = true; }
  };
  const advance = (ms) => {
    const target = now + ms;
    for (;;) {
      const next = timers.filter((t) => !t.dead && !t.done && t.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      now = next.at; next.done = true; next.fn();
    }
    now = target;
  };
  vm.createContext(sandbox);
  vm.runInContext(introSrc, sandbox);
  return { els, video, rest, root, doc, advance, sandbox };
}
const flush = () => new Promise((r) => setImmediate(r));

(async () => {
  {
    const t = boot({ active: false });
    check('tidak aktif: overlay dibuang & video tidak diputar', t.els.intro.removed && t.video.playCalls === 0, `removed=${t.els.intro.removed} play=${t.video.playCalls}`);
  }
  {
    const t = boot();
    check('aktif: video diputar tanpa suara', t.video.playCalls === 1 && t.video.muted === true && t.video.preload === 'auto', JSON.stringify([t.video.playCalls, t.video.muted, t.video.preload]));
    check('aktif: tombol Lewati mendapat fokus', t.els['intro-skip'].focused, '');
    check('aktif: bagian lain dinonaktifkan (inert)', t.rest.every((e) => 'inert' in e.attrs), '');
    check('aktif: ditandai sudah dilihat', t.sandbox.sessionStorage._s['slbn-intro-seen'] === '1', JSON.stringify(t.sandbox.sessionStorage._s));
    t.video.emit('playing');
    t.video.emit('ended');
    check('video selesai: memudar & inert dilepas', t.els.intro.classes.has('is-leaving') && t.rest.every((e) => !('inert' in e.attrs)), '');
    check('sebelum fade selesai overlay belum dibuang', !t.els.intro.removed && t.root.classes.has('has-intro'), '');
    t.advance(700);
    check('setelah fade: overlay dibuang & kunci scroll dilepas', t.els.intro.removed && !t.root.classes.has('has-intro'), '');
  }
  {
    const t = boot(); t.video.emit('playing');
    t.els['intro-skip'].emit('click');
    check('tombol Lewati menutup pembuka', t.els.intro.classes.has('is-leaving') && t.video.pauseCalls >= 1, '');
  }
  {
    const t = boot(); t.video.emit('playing');
    t.doc.emit('keydown', { key: 'Enter' });
    check('tombol lain tidak menutup', !t.els.intro.classes.has('is-leaving'), '');
    t.doc.emit('keydown', { key: 'Escape' });
    check('Escape menutup pembuka', t.els.intro.classes.has('is-leaving'), '');
  }
  {
    const t = boot({ playImpl: () => Promise.reject(new Error('NotAllowedError')) });
    await flush();
    check('autoplay diblokir -> langsung buka website', t.els.intro.classes.has('is-leaving'), '');
  }
  {
    const t = boot();
    t.advance(4400);
    check('video belum mulai < 4,5 detik: masih menunggu', !t.els.intro.classes.has('is-leaving'), '');
    t.advance(200);
    check('video tak kunjung mulai -> buka website', t.els.intro.classes.has('is-leaving'), '');
  }
  {
    const t = boot(); t.video.emit('playing'); t.advance(2000);
    check('video berjalan normal tidak dipotong timeout awal', !t.els.intro.classes.has('is-leaving'), '');
    t.video.emit('waiting'); t.advance(4600);
    check('video tersendat terlalu lama -> buka website', t.els.intro.classes.has('is-leaving'), '');
  }
  {
    const t = boot(); t.video.emit('playing'); t.video.emit('waiting'); t.video.emit('playing'); t.advance(5000);
    check('tersendat sebentar lalu pulih -> lanjut', !t.els.intro.classes.has('is-leaving'), '');
    t.advance(10000);
    check('pengaman total 14 detik', t.els.intro.classes.has('is-leaving'), '');
  }
  {
    const t = boot(); t.video.emit('error');
    check('video rusak/gagal -> langsung buka website', t.els.intro.classes.has('is-leaving'), '');
  }
  {
    const t = boot(); t.video.emit('playing');
    t.els['intro-sound'].emit('click');
    check('tombol suara: menyalakan', t.video.muted === false && t.els['intro-sound'].attrs['aria-pressed'] === 'true' && /Matikan/.test(t.els['intro-sound'].text), t.els['intro-sound'].text);
    t.els['intro-sound'].emit('click');
    check('tombol suara: mematikan lagi', t.video.muted === true && t.els['intro-sound'].attrs['aria-pressed'] === 'false', '');
  }
  {
    const t = boot(); t.video.emit('ended'); t.video.emit('ended'); t.els['intro-skip'].emit('click');
    t.advance(1000);
    check('selesai berkali-kali tidak menimbulkan error', t.els.intro.removed, '');
  }

  // ---------- 3) markup ----------
  check('overlay ada di awal <body> (sebelum skip link)', html.indexOf('id="intro"') < html.indexOf('class="skip-link"') && html.indexOf('id="intro"') > html.indexOf('<body'), '');
  check('video: muted, playsinline, preload none (tidak mengunduh bila tak dipakai)', /<video id="intro-video"[^>]*\bmuted\b[^>]*\bplaysinline\b[^>]*preload="none"/.test(html), '');
  check('video: tidak memakai autoplay otomatis', !/<video id="intro-video"[^>]*\bautoplay\b/.test(html), '');
  check('file video ada & ringan (< 3 MB)', fs.existsSync(path.join(__dirname, '../assets/logo-reveal.mp4')) && fs.statSync(path.join(__dirname, '../assets/logo-reveal.mp4')).size < 3 * 1024 * 1024, '');
  check('intro.js dimuat dengan defer', /<script src="js\/intro\.js\?v=\d+" defer><\/script>/.test(html), '');

  console.log(`\nSelesai: ${pass} lulus, ${fail} gagal.`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR UJI:', e.stack); process.exit(1); });
