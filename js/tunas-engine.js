/* ==========================================================================
   TUNAS-ENGINE.JS - "Otak" asisten TUNAS (tanpa DOM, tanpa jaringan).
   Mencocokkan pertanyaan dengan basis pengetahuan (data/tunas-kb.json) memakai
   normalisasi bahasa gaul, toleransi salah ketik, dan pembobotan kata kunci.
   Menangani alur khusus orang tua (usia + hambatan anak -> ringkasan) serta
   topik keselamatan. Bisa dijalankan di browser maupun Node (untuk pengujian).
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TunasEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SLANG = {
    gak: 'tidak', ga: 'tidak', nggak: 'tidak', ngga: 'tidak', tdk: 'tidak', gk: 'tidak',
    gimana: 'bagaimana', gmn: 'bagaimana', bgmn: 'bagaimana', dmn: 'dimana', dmana: 'dimana',
    brp: 'berapa', yg: 'yang', utk: 'untuk', dgn: 'dengan', sy: 'saya', aq: 'aku', sklh: 'sekolah',
    tlp: 'telepon', telp: 'telepon', wa: 'whatsapp', ortu: 'orang tua', pake: 'pakai',
    makasih: 'terima kasih', terimakasih: 'terima kasih', trims: 'terima kasih', thanks: 'terima kasih', thx: 'terima kasih',
    mksh: 'terima kasih', hesty: 'hesti'
  };
  const GREET = new Set(['halo', 'hallo', 'hai', 'hi', 'hello', 'hey', 'assalamualaikum', 'salam', 'permisi', 'pagi', 'siang', 'sore',
    'malam', 'selamat', 'tes', 'test', 'p', 'wr', 'wb', 'warahmatullahi', 'wabarakatuh', 'bu', 'pak', 'ibu', 'bapak', 'kak', 'tunas']);
  const ACK = new Set(['ok', 'oke', 'okey', 'siap', 'baik', 'baiklah', 'sip', 'mantap', 'sudah', 'ya', 'iya', 'oh', 'o', 'noted', 'paham', 'mengerti']);
  const WORRY = new Set(['khawatir', 'cemas', 'sedih', 'bingung', 'takut', 'stres', 'stress', 'galau', 'pusing', 'kasihan', 'panik', 'prihatin', 'resah', 'gelisah']);
  const CHILD_CUES = ['anak saya', 'anakku', 'anak kami', 'putra saya', 'putri saya', 'putra kami', 'putri kami', 'adik saya',
    'keponakan saya', 'cucu saya', 'murid saya', 'si kecil', 'buah hati', 'anak aku'];
  const NUM_WORDS = { 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
    'sebelas': 11, 'dua belas': 12, 'tiga belas': 13, 'empat belas': 14, 'lima belas': 15, 'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18 };

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function expand(norm) {
    return norm.split(' ').filter(Boolean).map((t) => SLANG[t] || t).join(' ');
  }
  function stemWord(w) {
    let s = w;
    if (s.length < 5) return s;
    let t = s.replace(/nya$/, '');
    if (t.length >= 4) s = t;
    t = s.replace(/(kah|lah|pun)$/, '');
    if (t.length >= 5) s = t;                 // "sekolah" tidak boleh menjadi "seko"
    if (s.length >= 6) { t = s.replace(/(kan|an)$/, ''); if (t.length >= 4) s = t; }
    const prefixes = ['meng', 'meny', 'peng', 'peny', 'mem', 'men', 'pem', 'pen', 'ber', 'ter', 'per', 'me', 'pe', 'di', 'ke', 'se'];
    for (const p of prefixes) {
      if (s.startsWith(p) && s.length - p.length >= 4) { s = s.slice(p.length); break; }
    }
    return s;
  }
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function prep(k) {
    const nk = expand(normalize(k));
    const words = nk ? nk.split(' ').map((w) => ({ raw: w, stem: stemWord(w) })) : [];
    return { nk, words, multi: words.length > 1, stem: stemWord(nk), len: nk.length };
  }
  function analyze(text) {
    const norm = expand(normalize(text));
    const tokens = norm ? norm.split(' ') : [];
    return { norm, tokens, forms: tokens.map((t) => ({ raw: t, stem: stemWord(t) })) };
  }
  // Skor satu kata kunci tunggal terhadap satu kata pengguna: sama persis 2, sama akar kata 1.8, salah ketik 1.2
  function tokenScore(kw, f) {
    if (f.raw === kw.nk) return 2;
    if (kw.len >= 5) {
      if (f.stem === kw.stem && f.stem.length >= 4) return 1.8;
      const max = kw.len >= 8 ? 2 : 1;
      if (f.raw.length >= 4 && lev(f.raw, kw.nk, max) <= max) return 1.2;
    }
    return 0;
  }
  function wordMatch(w, f) { return f.raw === w.raw || (f.stem === w.stem && w.stem.length >= 4); }
  function findPhrase(kw, an) {
    const n = kw.words.length;
    for (let i = 0; i + n <= an.forms.length; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) if (!wordMatch(kw.words[j], an.forms[i + j])) { ok = false; break; }
      if (ok) return i;
    }
    return -1;
  }
  // Skor daftar kata kunci: frasa (terpanjang dulu) bernilai 2.5; tiap kata pengguna hanya dihitung sekali
  // (skor tertinggi), jadi variasi "daftar/mendaftar/pendaftaran" tidak menggelembungkan nilai satu topik.
  function scoreList(kws, an) {
    const covered = new Array(an.forms.length).fill(false);
    let score = 0, hits = 0;
    const phrases = kws.filter((k) => k.multi).sort((a, b) => b.words.length - a.words.length);
    for (const kw of phrases) {
      const at = findPhrase(kw, an);
      if (at < 0) continue;
      let fresh = false;
      for (let j = 0; j < kw.words.length; j++) if (!covered[at + j]) fresh = true;
      if (!fresh) continue;
      score += 2.5; hits++;
      for (let j = 0; j < kw.words.length; j++) covered[at + j] = true;
    }
    const best = new Array(an.forms.length).fill(0);
    for (const kw of kws) {
      if (kw.multi) continue;
      for (let i = 0; i < an.forms.length; i++) {
        if (covered[i]) continue;
        const s = tokenScore(kw, an.forms[i]);
        if (s > best[i]) best[i] = s;
      }
    }
    best.forEach((s) => { if (s > 0) { score += s; hits++; } });
    return { score, hits };
  }

  function parseAge(rawText, norm) {
    const raw = String(rawText || '').toLowerCase();
    let m = raw.match(/(\d{1,2})(?:[.,](\d))?\s*(?:tahun|thn|th)\b/);
    if (m) { const v = parseFloat(m[1] + (m[2] ? '.' + m[2] : '')); return { value: v, text: (m[2] ? m[1] + ',' + m[2] : m[1]) + ' tahun' }; }
    m = raw.match(/\b(?:usia|umur|berumur|berusia)\s*(\d{1,2})\b/);
    if (m) return { value: +m[1], text: m[1] + ' tahun' };
    m = raw.match(/(\d{1,2})\s*bulan\b/);
    if (m) return { value: +m[1] / 12, text: m[1] + ' bulan' };
    const keys = Object.keys(NUM_WORDS).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if ((' ' + norm + ' ').indexOf(' ' + k + ' tahun ') !== -1) return { value: NUM_WORDS[k], text: NUM_WORDS[k] + ' tahun' };
    }
    return null;
  }

  function jenjangLine(ctx) {
    const v = ctx.age, t = ctx.ageText;
    if (v == null) return '';
    if (v < 4) return 'Anak usia ' + t + ' belum masuk usia sekolah jenjang SDLB sampai SMALB. Bapak/Ibu tetap bisa berkonsultasi lebih awal, karena stimulasi dan pemeriksaan dini sangat membantu.';
    if (v < 7) return 'Anak usia ' + t + ' masih di usia dini. Jenjang SDLB umumnya dimulai sekitar usia 7 tahun; apakah ada layanan untuk usia dini, sebaiknya ditanyakan langsung ke Bu Hesti.';
    if (v < 13) return 'Anak usia ' + t + ' umumnya berada di jenjang SDLB.';
    if (v < 16) return 'Anak usia ' + t + ' umumnya berada di jenjang SMPLB.';
    if (v < 19) return 'Anak usia ' + t + ' umumnya berada di jenjang SMALB.';
    return 'Usia ' + t + ' sudah melewati usia sekolah pada umumnya; silakan tanyakan ke Bu Hesti tentang kemungkinan layanan atau pelatihan vokasi yang sesuai.';
  }

  function createEngine(kb) {
    const cfg = kb.config || {};
    const csName = cfg.csName || 'Bu Hesti';
    const entries = kb.entries.map((e) => Object.assign({}, e, { _kw: (e.keywords || []).map(prep) }));
    const byId = {};
    entries.forEach((e) => { byId[e.id] = e; });
    const needs = kb.needs || {};
    Object.keys(needs).forEach((k) => { needs[k]._w = (needs[k].words || []).map(prep); });
    const safety = kb.safety || {};
    Object.keys(safety).forEach((k) => { safety[k]._w = (safety[k].words || []).map(prep); });

    const quickIds = kb.quick || [];
    const chip = (id) => ({ label: byId[id].title, entryId: id });
    const quickChips = () => quickIds.filter((id) => byId[id]).map(chip);

    function newContext() {
      return { age: null, ageText: '', need: null, awaiting: null, worried: false, skippedAge: false, lastQuestion: '' };
    }
    function resetParent(ctx) { ctx.age = null; ctx.ageText = ''; ctx.need = null; ctx.awaiting = null; ctx.worried = false; ctx.skippedAge = false; }

    function csMessage(ctx) {
      let t = 'Halo ' + csName + ', saya menghubungi lewat asisten TUNAS di website SLB Negeri Tompokersan Lumajang.';
      if (ctx && ctx.lastQuestion) t += ' Pertanyaan saya: "' + ctx.lastQuestion + '"';
      const info = [];
      if (ctx && ctx.age != null) info.push('usia anak ' + ctx.ageText);
      if (ctx && ctx.need && needs[ctx.need]) info.push('kebutuhan terkait ' + needs[ctx.need].label);
      if (info.length) t += ' (' + info.join('; ') + ')';
      return t;
    }
    function consultMessage(ctx) {
      let t = 'Halo ' + csName + ', saya orang tua dari anak';
      if (ctx.age != null) t += ' usia ' + ctx.ageText;
      if (ctx.need && needs[ctx.need]) t += ' dengan kebutuhan terkait ' + needs[ctx.need].label;
      return t + '. Saya ingin berkonsultasi tentang layanan dan SPMB 2026/2027. (dikirim lewat asisten TUNAS di website)';
    }

    function rank(an) {
      const out = [];
      entries.forEach((e, idx) => {
        if (!e._kw.length) return;
        const r = scoreList(e._kw, an);
        if (r.score > 0) out.push({ entry: e, score: r.score, hits: r.hits, idx });
      });
      out.sort((a, b) => b.score - a.score || b.hits - a.hits || a.idx - b.idx);
      return out;
    }
    function detectNeed(an, askedNow) {
      let best = null, bestScore = 0;
      Object.keys(needs).forEach((key) => {
        const n = needs[key];
        if (n.onlyWhenAsked && !askedNow) return;
        const score = scoreList(n._w, an).score;
        if (score > bestScore) { best = key; bestScore = score; }
      });
      return bestScore >= 1.2 ? best : null;
    }
    function checkSafety(an) {
      for (const key of Object.keys(safety)) {
        const cat = safety[key];
        if (scoreList(cat._w, an).score >= 1.8) return { type: 'safety', entryId: null, text: cat.text, actions: cat.actions || [], chips: [] };
      }
      return null;
    }

    function followChips(entry) {
      const out = [];
      (entry.follow || []).forEach((id) => { if (byId[id] && id !== entry.id) out.push(chip(id)); });
      for (const id of quickIds) { if (out.length >= 4) break; if (id !== entry.id && byId[id] && !out.some((c) => c.entryId === id)) out.push(chip(id)); }
      return out.slice(0, 4);
    }

    /* ---------- alur orang tua ---------- */
    const AGE_CHIPS = [
      { label: 'Di bawah 4 tahun', age: { value: 3, text: 'di bawah 4 tahun' } },
      { label: '4-6 tahun', age: { value: 5, text: '4-6 tahun' } },
      { label: '7-12 tahun', age: { value: 9, text: '7-12 tahun' } },
      { label: '13-15 tahun', age: { value: 14, text: '13-15 tahun' } },
      { label: '16 tahun ke atas', age: { value: 17, text: '16 tahun ke atas' } },
      { label: 'Lewati', action: 'skip' }
    ];
    const NEED_CHIPS = (kb.needChips || []).map((c) => ({ label: c.label, need: c.need }));

    function empathy(ctx, first) {
      if (ctx.worried) return 'Terima kasih sudah berbagi, Bapak/Ibu. Wajar sekali merasa khawatir, dan mencari informasi seperti ini adalah langkah yang baik. Bapak/Ibu tidak sendirian. 🌱';
      return first ? 'Dengan senang hati, Bapak/Ibu. 🌱' : '';
    }
    function nextParentStep(ctx, first) {
      if (ctx.age == null && !ctx.skippedAge) {
        ctx.awaiting = 'age';
        const intro = empathy(ctx, first);
        return { type: 'parent', entryId: 'anak', chips: AGE_CHIPS,
          text: (intro ? intro + '\n\n' : '') + 'Boleh tahu usia putra/putri Bapak/Ibu? Bisa diketik (misalnya "7 tahun") atau dipilih di bawah. Aku akan mengingatnya selama kita mengobrol.' };
      }
      if (!ctx.need) {
        ctx.awaiting = 'need';
        const intro = ctx.age != null ? 'Terima kasih.' : empathy(ctx, first);
        return { type: 'parent', entryId: 'anak', chips: NEED_CHIPS,
          text: (intro ? intro + ' ' : '') + 'Boleh tahu hambatan atau hal yang paling Bapak/Ibu khawatirkan? Pilih di bawah, atau ceritakan dengan kata-kata sendiri (misalnya "belum bisa bicara" atau "sulit mendengar"). Kalau belum tahu, tidak apa-apa.' };
      }
      ctx.awaiting = null;
      return summaryReply(ctx);
    }
    function summaryReply(ctx) {
      const need = ctx.need ? needs[ctx.need] : null;
      const parts = [];
      parts.push(ctx.worried
        ? 'Terima kasih sudah berbagi, Bapak/Ibu. Wajar sekali merasa khawatir, dan Bapak/Ibu tidak sendirian. 🌱'
        : 'Terima kasih sudah bertanya tentang putra/putri Bapak/Ibu. 🌱');
      parts.push(jenjangLine(ctx));
      if (need) parts.push('Untuk kebutuhan terkait ' + need.label + ': ' + need.layanan);
      parts.push('Langkah yang bisa Bapak/Ibu lakukan:\n1) Coba Skrining Awal Mandiri di website (hanya gambaran awal, bukan diagnosis).\n2) Bila perlu penegasan, periksakan ke dokter anak atau psikolog.\n3) Bicarakan langsung dengan ' + csName + ' tentang kebutuhan anak dan proses SPMB 2026/2027 (gratis).');
      parts.push('Layanan dan penempatan yang paling tepat sebaiknya dibicarakan bersama tim sekolah.');
      return {
        type: 'parent', entryId: 'anak', text: parts.filter(Boolean).join('\n\n'),
        actions: [
          { label: '🎯 Coba skrining', goto: '#skrining' },
          { label: '💬 Konsultasi dengan ' + csName, wa: consultMessage(ctx) },
          { label: '📝 Info SPMB', goto: '#spmb' }
        ],
        chips: [chip('biaya'), chip('spmb'), chip('layanan'), { label: 'Ceritakan anak lain', action: 'reset' }]
      };
    }

    function answerEntry(entry, ctx) {
      if (entry.flow === 'parent') return nextParentStep(ctx, true);
      let text = entry.answer;
      if (entry.personalize === 'jenjang' && ctx.age != null) text += '\n\n' + jenjangLine(ctx);
      return { type: 'answer', entryId: entry.id, text, actions: entry.actions || [], chips: followChips(entry) };
    }

    function fallbackReply(ctx, ranked) {
      const sugg = ranked.filter((r) => r.score >= 1 && r.entry.flow !== 'parent').slice(0, 3).map((r) => chip(r.entry.id));
      if (!sugg.length) quickIds.filter((id) => byId[id] && id !== 'cs').slice(0, 3).forEach((id) => sugg.push(chip(id)));
      return { type: 'fallback', entryId: null, text: kb.fallbackText,
        actions: [{ label: '💬 Tanya ' + csName, wa: csMessage(ctx) }], chips: sugg };
    }

    /* ---------- pintu masuk ---------- */
    function decide(text, ctx, opts) {
      opts = opts || {};
      if (opts.action === 'reset') { resetParent(ctx); const r = nextParentStep(ctx, true); r.text = 'Baik, kita mulai dari awal.\n\n' + r.text; return r; }
      if (opts.action === 'skip') { ctx.skippedAge = true; ctx.awaiting = null; return nextParentStep(ctx, false); }
      if (opts.age) { ctx.age = opts.age.value; ctx.ageText = opts.age.text; ctx.skippedAge = false; return nextParentStep(ctx, false); }
      if (opts.need) { ctx.need = opts.need; return nextParentStep(ctx, false); }
      if (opts.entryId && byId[opts.entryId]) return answerEntry(byId[opts.entryId], ctx);

      const raw = String(text || '').trim();
      const an = analyze(raw);

      const safe = checkSafety(an);
      if (safe) return safe;

      if (an.tokens.some((t) => WORRY.has(t))) ctx.worried = true;

      if (ctx.awaiting === 'age') {
        const a = parseAge(raw, an.norm) || (/^\d{1,2}$/.test(an.norm) ? { value: +an.norm, text: an.norm + ' tahun' } : null);
        if (a) { ctx.age = a.value; ctx.ageText = a.text; ctx.skippedAge = false; return nextParentStep(ctx, false); }
        if (/\b(lewati|skip|tidak tahu|belum tahu)\b/.test(an.norm)) { ctx.skippedAge = true; return nextParentStep(ctx, false); }
        ctx.awaiting = null;
      } else if (ctx.awaiting === 'need') {
        const n = detectNeed(an, true);
        if (n) { ctx.need = n; return nextParentStep(ctx, false); }
        ctx.awaiting = null;
      }

      if (an.tokens.length && an.tokens.length <= 6 && an.tokens.every((t) => GREET.has(t))) {
        return { type: 'greeting', entryId: null, text: kb.greetingReply, actions: [], chips: quickChips() };
      }
      if (an.norm.indexOf('terima kasih') !== -1 && an.tokens.length <= 5) {
        return { type: 'thanks', entryId: null, text: kb.thanksReply, actions: [], chips: quickChips() };
      }
      if (an.tokens.length && an.tokens.length <= 3 && an.tokens.every((t) => ACK.has(t))) {
        return { type: 'ack', entryId: null, text: kb.ackReply, actions: [], chips: quickChips() };
      }

      const age = parseAge(raw, an.norm);
      const need = detectNeed(an, false);
      const hasCue = CHILD_CUES.some((c) => (' ' + an.norm + ' ').indexOf(' ' + c + ' ') !== -1);
      const personal = an.tokens.some((t) => t === 'saya' || t === 'kami' || t === 'aku');
      if (hasCue || (need && an.tokens.indexOf('anak') !== -1 && personal)) {
        if (age) { ctx.age = age.value; ctx.ageText = age.text; ctx.skippedAge = false; }
        if (need) ctx.need = need;
        return nextParentStep(ctx, true);
      }

      const ranked = rank(an);
      if (ranked.length && ranked[0].score >= 1.8) {
        const r = answerEntry(ranked[0].entry, ctx);
        const second = ranked[1];
        if (r.type === 'answer' && second && second.score >= 1.8 && second.entry.flow !== 'parent' && !r.chips.some((c) => c.entryId === second.entry.id)) {
          r.chips = [chip(second.entry.id)].concat(r.chips).slice(0, 4);
        }
        return r;
      }
      return fallbackReply(ctx, ranked);
    }

    return {
      decide, newContext, quickChips, csMessage, consultMessage,
      greeting: () => ({ text: kb.greeting, chips: quickChips() }),
      entryById: (id) => byId[id] || null,
      config: cfg, aiNotice: kb.aiNotice,
      _internal: { analyze, rank, parseAge, detectNeed }
    };
  }

  return { createEngine, normalize };
});
