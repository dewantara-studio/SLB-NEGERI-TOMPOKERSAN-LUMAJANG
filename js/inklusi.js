/* ==========================================================================
   INKLUSI.JS — Fitur layanan inklusi SLB Negeri Tompokersan Lumajang
   1. Skrining awal mandiri + check-list deteksi dini
   2. Ruang multisensori (Snoezelen) + Mode Suasana Penenang (nada latar)
   3. Penerjemah visual Braille & SIBI
   4. E-katalog karya & produk siswa vokasi
   Vanilla JS, tanpa backend, tanpa library tambahan.
   ========================================================================== */
(function () {
  'use strict';

  const WA_NUMBER = '6281333881251'; // Bu Hesti, kontak utama
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Toast (pemberitahuan singkat, dibacakan pembaca layar) ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  }

  /* ======================================================================
     1. SKRINING AWAL MANDIRI
  ====================================================================== */
  const AGES = [
    { key: '4-6', title: '4 – 6 tahun', hint: 'Usia dini' },
    { key: '7-12', title: '7 – 12 tahun', hint: 'SDLB' },
    { key: '13-15', title: '13 – 15 tahun', hint: 'SMPLB' },
    { key: '16+', title: '16 tahun ke atas', hint: 'SMALB' }
  ];

  const DOMAINS = {
    autism: {
      icon: '🧩', label: 'Interaksi & Komunikasi', sub: 'Spektrum autisme',
      behaviors: [
        'Kontak mata sangat minim / sering menghindari pandangan',
        'Kesulitan mengutarakan keinginan secara lisan (keterlambatan bicara)',
        'Melakukan gerakan berulang (berputar, mengepak tangan, menyusun benda berbaris)'
      ],
      summary: 'Anak dengan kebutuhan pada interaksi dan komunikasi umumnya terbantu oleh rutinitas yang terstruktur, panduan visual bergambar, dan cara berkomunikasi yang konsisten.',
      focus: ['Regulasi emosi', 'Jadwal visual harian', 'Latihan komunikasi', 'Stimulasi sensori']
    },
    intellectual: {
      icon: '🧠', label: 'Pemahaman & Akademik', sub: 'Tunagrahita',
      behaviors: [
        'Kesulitan memahami instruksi 2 tahapan sekaligus',
        'Perkembangan kognitif dan daya tangkap di bawah usianya',
        'Memerlukan bantuan ekstra dalam bina diri mandiri (makan, mandi)'
      ],
      summary: 'Anak dengan kebutuhan pada pemahaman umumnya terbantu oleh instruksi bertahap yang sederhana, pengulangan, dan latihan keterampilan hidup sehari-hari.',
      focus: ['Bina diri (ADL)', 'Kognitif terapan harian', 'Keterampilan sosial dasar', 'Pengenalan keterampilan vokasi']
    },
    hearing: {
      icon: '🧏', label: 'Pendengaran & Bicara', sub: 'Tunarungu',
      behaviors: [
        'Tidak merespons panggilan suara biasa, lebih fokus pada visual',
        'Pengucapan kata masih terbatas / belum jelas',
        'Sering mengandalkan isyarat atau gestur tangan'
      ],
      summary: 'Anak dengan kebutuhan pada pendengaran dan bicara umumnya terbantu oleh komunikasi visual, latihan artikulasi, dan penggunaan sistem isyarat yang konsisten di sekolah maupun di rumah.',
      focus: ['Latihan artikulasi wicara', 'Persepsi bunyi & irama (BKPBI)', 'Bahasa isyarat (SIBI)']
    },
    vision: {
      icon: '🦯', label: 'Penglihatan & Spasial', sub: 'Tunanetra',
      behaviors: [
        'Hambatan penglihatan yang signifikan (low vision / tunanetra total)',
        'Kesulitan menentukan arah dan mengenali huruf cetak',
        'Meraba benda di sekitar untuk mengenali lingkungan'
      ],
      summary: 'Anak dengan kebutuhan pada penglihatan umumnya terbantu oleh media taktil dan audio, huruf Braille, serta latihan orientasi dan mobilitas.',
      focus: ['Literasi Braille', 'Orientasi & Mobilitas', 'Teknologi audio']
    },
    motoric: {
      icon: '♿', label: 'Gerak Fisik & Motorik', sub: 'Tunadaksa',
      behaviors: [
        'Hambatan koordinasi gerak tangan / anggota tubuh',
        'Menggunakan alat bantu gerak (kursi roda / kruk)',
        'Kontrol motorik halus lemah (misalnya sulit memegang pensil)'
      ],
      summary: 'Anak dengan kebutuhan pada gerak dan motorik umumnya terbantu oleh lingkungan yang ramah aksesibilitas, latihan bina gerak, dan alat bantu belajar yang sesuai.',
      focus: ['Bina gerak', 'Latihan motorik halus', 'Lingkungan ramah aksesibilitas']
    },
    general: {
      icon: '❓', label: 'Kombinasi / Belum Yakin', sub: 'Skrining umum',
      behaviors: [
        'Perkembangan emosi atau pemahaman perlu dievaluasi lebih menyeluruh',
        'Hambatan belajar akademik dasar secara umum',
        'Kombinasi tantangan sensorik dan respons verbal'
      ],
      summary: 'Untuk kebutuhan yang belum jelas atau gabungan, langkah terbaik adalah pemetaan menyeluruh oleh tenaga profesional bersama guru dan orang tua.',
      focus: ['Asesmen oleh tenaga profesional', 'Pemetaan kebutuhan belajar', 'Konsultasi guru & orang tua']
    }
  };

  function initSkrining() {
    const wizard = $('#skrining-wizard');
    if (!wizard) return;

    const state = { age: null, domainKey: null, picked: new Set() };
    const panels = { 1: $('#step-1'), 2: $('#step-2'), 3: $('#step-3'), result: $('#step-result') };
    const indicators = $$('#stepper li');
    const agesBox = $('#skrining-ages');
    const domainsBox = $('#skrining-domains');
    const behBox = $('#skrining-behaviors');
    const resultBtn = $('#btn-lihat-hasil');

    function goTo(key, moveFocus) {
      Object.keys(panels).forEach((k) => { panels[k].hidden = String(k) !== String(key); });
      const current = key === 'result' ? 4 : Number(key);
      indicators.forEach((li, i) => {
        const n = i + 1;
        li.classList.toggle('is-active', n === current);
        li.classList.toggle('is-done', n < current);
        if (n === current) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      if (moveFocus) {
        const heading = $('h3', panels[key]);
        if (heading) heading.focus();
      }
    }

    // Langkah 1: usia
    AGES.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<strong>${esc(a.title)}</strong><small>${esc(a.hint)}</small>`;
      b.addEventListener('click', () => {
        state.age = a;
        $$('.choice', agesBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        goTo(2, true);
      });
      agesBox.appendChild(b);
    });

    // Langkah 3: daftar tanda sesuai domain
    function buildBehaviors(domain) {
      behBox.innerHTML = '';
      state.picked.clear();
      resultBtn.disabled = true;
      domain.behaviors.forEach((text, i) => {
        const label = document.createElement('label');
        label.className = 'check-option';
        label.innerHTML = `<input type="checkbox" value="${i}"><span>${esc(text)}</span>`;
        $('input', label).addEventListener('change', (e) => {
          if (e.target.checked) state.picked.add(i); else state.picked.delete(i);
          resultBtn.disabled = state.picked.size === 0;
        });
        behBox.appendChild(label);
      });
    }

    // Langkah 2: domain
    Object.entries(DOMAINS).forEach(([key, d]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="choice__icon" aria-hidden="true">${d.icon}</span><strong>${esc(d.label)}</strong><small>${esc(d.sub)}</small>`;
      b.addEventListener('click', () => {
        state.domainKey = key;
        $$('.choice', domainsBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        buildBehaviors(d);
        goTo(3, true);
      });
      domainsBox.appendChild(b);
    });

    $$('[data-back]', wizard).forEach((btn) => btn.addEventListener('click', () => goTo(btn.dataset.back, true)));

    // Hasil
    resultBtn.addEventListener('click', () => {
      const d = DOMAINS[state.domainKey];
      if (!state.age || !d || !state.picked.size) return;
      const signs = Array.from(state.picked).sort().map((i) => d.behaviors[i]);

      $('#result-profile').textContent = `Anak ${state.age.title} (${state.age.hint}) · ${d.label} — ${d.sub}`;
      $('#result-summary').textContent = d.summary;
      const signsEl = $('#result-signs');
      const tagsEl = $('#result-tags');
      signsEl.innerHTML = signs.map((s) => `<li>${esc(s)}</li>`).join('');
      tagsEl.innerHTML = d.focus.map((t) => `<li>${esc(t)}</li>`).join('');

      const message = [
        'Halo SLB Negeri Tompokersan Lumajang, saya sudah mengisi skrining awal mandiri di website.',
        `Usia anak: ${state.age.title} (${state.age.hint})`,
        `Domain: ${d.label} (${d.sub})`,
        'Tanda yang sering terlihat:',
        ...signs.map((s) => `- ${s}`),
        'Mohon informasi tindak lanjutnya. Terima kasih.'
      ].join('\n');
      $('#btn-wa-result').href = waLink(message);

      goTo('result', true);
      showToast('Skrining selesai. Hasil ini bukan diagnosis.');
    });

    $('#btn-restart').addEventListener('click', () => {
      state.age = null; state.domainKey = null; state.picked.clear();
      $$('.choice', wizard).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      goTo(1, true);
    });
  }

  function initChecklist() {
    const box = $('#checklist');
    if (!box) return;
    const boxes = $$('input[type="checkbox"]', box);
    const counter = $('#checklist-count');
    const message = $('#checklist-message');
    const cta = $('#checklist-cta');
    const update = () => {
      const n = boxes.filter((b) => b.checked).length;
      counter.textContent = `${n} dari ${boxes.length} tanda dicentang`;
      message.textContent = n === 0
        ? 'Centang tanda yang pernah Anda amati pada anak.'
        : 'Catat kapan dan seberapa sering tanda itu muncul, lalu diskusikan dengan dokter anak, psikolog, atau tim sekolah. Satu tanda saja belum berarti ada hambatan — perkembangan setiap anak berbeda.';
      cta.hidden = n === 0;
    };
    boxes.forEach((b) => b.addEventListener('change', update));
    update();
  }

  /* ======================================================================
     2. RUANG MULTISENSORI — Snoezelen + Mode Suasana Penenang
  ====================================================================== */
  function initSensory() {
    const canvas = $('#sensory-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const HUES = { ocean: 190, sunset: 35, forest: 150, lavender: 270 };
    const THEME_NAMES = { ocean: 'Biru Laut', sunset: 'Senja Hangat', forest: 'Hutan Hijau', lavender: 'Ungu Lembut' };
    const SPEEDS = { 1: { f: 0.5, t: 'Lambat (relaksasi)' }, 2: { f: 1, t: 'Normal' }, 3: { f: 1.8, t: 'Cepat (stimulasi)' } };

    let W = 0, H = 0, bubbles = [], theme = 'ocean', speed = 2, raf = null;
    let visible = false, userPaused = prefersReducedMotion;

    const toggleBtn = $('#sensory-toggle');
    const modeLabel = $('#sensory-mode-label');
    const speedText = $('#sensory-speed-text');

    const makeBubble = (initial) => ({
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + Math.random() * 40,
      r: Math.random() * 16 + 4,
      vy: -(Math.random() * 1.2 + 0.4),
      a: Math.random() * 0.7 + 0.3,
      hue: Math.random() * 40
    });

    function draw(clear) {
      ctx.fillStyle = clear ? '#020617' : 'rgba(2, 6, 23, 0.25)';
      ctx.fillRect(0, 0, W, H);
      const base = HUES[theme];
      for (const b of bubbles) {
        const hue = (base + b.hue) % 360;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${b.a})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${hue}, 90%, 65%)`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function step() {
      const f = SPEEDS[speed].f;
      bubbles.forEach((b, i) => {
        b.y += b.vy * f;
        if (b.y < -30) bubbles[i] = makeBubble(false);
      });
    }

    function frame() { step(); draw(false); raf = requestAnimationFrame(frame); }

    // Animasi hanya berjalan saat bagian ini terlihat, tidak dijeda pengguna, dan tab aktif.
    function sync() {
      const shouldRun = visible && !userPaused && !document.hidden;
      if (shouldRun && !raf) raf = requestAnimationFrame(frame);
      if (!shouldRun && raf) { cancelAnimationFrame(raf); raf = null; }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = rect.width; H = rect.height;
      if (!bubbles.length) bubbles = Array.from({ length: W < 520 ? 22 : 36 }, () => makeBubble(true));
      draw(true);
    }

    function burst(x, y) {
      for (let i = 0; i < 6; i++) {
        bubbles.push({
          x: x + (Math.random() * 30 - 15), y: y + (Math.random() * 30 - 15),
          r: Math.random() * 14 + 6, vy: -(Math.random() * 1.5 + 0.5), a: 0.9, hue: Math.random() * 60
        });
      }
      while (bubbles.length > 90) bubbles.shift();
      if (!raf) draw(true);
    }

    const setToggleLabel = () => { toggleBtn.textContent = userPaused ? '▶ Putar animasi' : '❚❚ Jeda animasi'; };

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      burst(e.clientX - rect.left, e.clientY - rect.top);
    });
    $('#sensory-burst').addEventListener('click', () => burst(W / 2, H * 0.7));
    toggleBtn.addEventListener('click', () => { userPaused = !userPaused; setToggleLabel(); sync(); });

    const themeBtns = $$('.theme-btn[data-theme]');
    themeBtns.forEach((btn) => btn.addEventListener('click', () => {
      theme = btn.dataset.theme;
      themeBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
      modeLabel.textContent = THEME_NAMES[theme];
      if (!raf) draw(true);
      showToast(`Warna cahaya: ${THEME_NAMES[theme]}`);
    }));

    $('#sensory-speed').addEventListener('input', (e) => {
      speed = Number(e.target.value);
      speedText.textContent = SPEEDS[speed].t;
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(canvas);
    } else { visible = true; }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);

    resize(); setToggleLabel(); sync();

    /* ---- Mode Suasana Penenang: nada sinus lembut (Web Audio) ---- */
    let audioCtx = null, osc = null, gain = null, activeTone = null;
    const statusEl = $('#sound-status');
    const volEl = $('#sound-volume');
    const toneBtns = $$('[data-tone]');
    const volume = () => Math.max(0.0001, (Number(volEl.value) / 100) * 0.2);

    function setToneUI(type) {
      activeTone = type;
      toneBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tone === type)));
      statusEl.textContent = type ? `Aktif · ${type === 'calm' ? 432 : 528} Hz` : 'Mati';
    }

    function stopTone(immediate) {
      if (!osc) { setToneUI(null); return; }
      const o = osc, g = gain;
      osc = null; gain = null;
      try {
        if (immediate) { o.stop(); o.disconnect(); }
        else {
          const t = audioCtx.currentTime;
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          o.stop(t + 0.55);
        }
      } catch (e) { /* sudah berhenti */ }
      setToneUI(null);
    }

    function playTone(type) {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        stopTone(true);
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = type === 'calm' ? 432 : 528;
        const t = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume(), t + 0.8); // masuk perlahan agar tidak mengagetkan
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start();
        setToneUI(type);
        showToast(type === 'calm' ? 'Nada Tenang diputar' : 'Nada Fokus diputar');
      } catch (e) {
        showToast('Perangkat ini tidak mendukung pemutar nada.');
      }
    }

    toneBtns.forEach((b) => b.addEventListener('click', () => (activeTone === b.dataset.tone ? stopTone(false) : playTone(b.dataset.tone))));
    $('#sound-stop').addEventListener('click', () => stopTone(false));
    volEl.addEventListener('input', () => { if (gain) gain.gain.setTargetAtTime(volume(), audioCtx.currentTime, 0.05); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopTone(true); });
    setToneUI(null);
  }

  /* ======================================================================
     3. PENERJEMAH VISUAL BRAILLE & SIBI
  ====================================================================== */
  // Titik Braille 6-dot: urutan [titik1..titik6]. Kolom kiri = titik 1-3, kolom kanan = titik 4-6.
  const BRAILLE = {
    A: [1,0,0,0,0,0], B: [1,1,0,0,0,0], C: [1,0,0,1,0,0], D: [1,0,0,1,1,0], E: [1,0,0,0,1,0],
    F: [1,1,0,1,0,0], G: [1,1,0,1,1,0], H: [1,1,0,0,1,0], I: [0,1,0,1,0,0], J: [0,1,0,1,1,0],
    K: [1,0,1,0,0,0], L: [1,1,1,0,0,0], M: [1,0,1,1,0,0], N: [1,0,1,1,1,0], O: [1,0,1,0,1,0],
    P: [1,1,1,1,0,0], Q: [1,1,1,1,1,0], R: [1,1,1,0,1,0], S: [0,1,1,1,0,0], T: [0,1,1,1,1,0],
    U: [1,0,1,0,0,1], V: [1,1,1,0,0,1], W: [0,1,0,1,1,1], X: [1,0,1,1,0,1], Y: [1,0,1,1,1,1], Z: [1,0,1,0,1,1]
  };
  // Gambar abjad isyarat SIBI resmi diletakkan di assets/img/sibi/a.png ... z.png
  const SIBI_PATH = 'assets/img/sibi/';

  function initTranslator() {
    const input = $('#bs-input');
    if (!input) return;
    const brailleOut = $('#braille-output');
    const sibiOut = $('#sibi-output');
    const sibiMissing = $('#sibi-missing');
    let sibiAvailable = null; // null = belum dicek

    // Isi sel legenda (penomoran titik 1-6)
    const legend = $('#braille-legend-cell');
    if (legend) legend.innerHTML = [1, 2, 3, 4, 5, 6].map((n) => `<span class="braille-dot">${n}</span>`).join('');

    function cleanText() {
      return input.value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ');
    }

    function render() {
      const text = cleanText();
      brailleOut.innerHTML = '';
      sibiOut.innerHTML = '';
      if (!text.trim()) {
        brailleOut.innerHTML = '<p class="translator__hint">Ketik huruf A–Z untuk melihat tampilan Braille.</p>';
        sibiOut.hidden = true;
        if (sibiMissing) sibiMissing.hidden = sibiAvailable !== false;
        return;
      }
      for (const ch of text) {
        if (ch === ' ') {
          brailleOut.insertAdjacentHTML('beforeend', '<div class="braille-item braille-item--space" aria-hidden="true"></div>');
          sibiOut.insertAdjacentHTML('beforeend', '<div class="sibi-card sibi-card--space" aria-hidden="true"></div>');
          continue;
        }
        const dots = BRAILLE[ch];
        const on = dots.map((v, i) => (v ? i + 1 : null)).filter(Boolean);
        brailleOut.insertAdjacentHTML('beforeend',
          `<div class="braille-item"><div class="braille-cell" role="img" aria-label="Huruf ${ch}: titik ${on.join(', ')}">` +
          dots.map((v) => `<span class="braille-dot${v ? ' is-on' : ''}"></span>`).join('') +
          `</div><span class="braille-letter" aria-hidden="true">${ch}</span></div>`);
        if (sibiAvailable) {
          sibiOut.insertAdjacentHTML('beforeend',
            `<div class="sibi-card"><img src="${SIBI_PATH}${ch.toLowerCase()}.png" alt="Isyarat SIBI huruf ${ch}" loading="lazy"><span aria-hidden="true">${ch}</span></div>`);
        }
      }
      sibiOut.hidden = !sibiAvailable;
      if (sibiMissing) sibiMissing.hidden = sibiAvailable !== false;
    }

    input.addEventListener('input', render);

    // Cek apakah gambar SIBI resmi sudah dipasang
    const probe = new Image();
    probe.onload = () => { sibiAvailable = true; render(); };
    probe.onerror = () => { sibiAvailable = false; render(); };
    probe.src = `${SIBI_PATH}a.png`;
    render();
  }

  /* ======================================================================
     4. E-KATALOG KARYA & PRODUK SISWA VOKASI
  ====================================================================== */
  const DEFAULT_PRODUK = [
    { program: 'Tata Boga', icon: '🍳', name: 'Olahan Makanan & Minuman', description: 'Aneka olahan makanan dan minuman hasil praktik murid Tata Boga, dibuat sesuai prosedur kebersihan dan keamanan pangan yang sederhana.' },
    { program: 'Tata Busana', icon: '🧵', name: 'Busana & Produk Tekstil', description: 'Hasil praktik membuat, memperbaiki, dan merawat pakaian serta produk tekstil sederhana.' },
    { program: 'Tata Graha', icon: '🏡', name: 'Perawatan Lingkungan', description: 'Praktik menjaga kebersihan, kerapian, dan perawatan lingkungan rumah maupun tempat kerja.', type: 'layanan' },
    { program: 'IT', icon: '💻', name: 'Karya Digital', description: 'Karya dan keterampilan digital murid: menggunakan komputer, internet, dan aplikasi secara aman dan produktif.' },
    { program: 'Keterampilan Rekayasa', icon: '🔧', name: 'Kerajinan Bahan Sederhana & Barang Bekas', description: 'Produk kerajinan bernilai guna dan bernilai ekonomi dari bahan sederhana maupun barang bekas.' },
    { program: 'Cuci Motor', icon: '🏍️', name: 'Layanan Cuci Motor', description: 'Praktik pencucian motor sesuai prosedur: mengenal alat dan bahan, keselamatan kerja, hingga tahap finishing.', type: 'layanan' },
    { program: 'Pijat (Massage)', icon: '💆', name: 'Layanan Pijat Dasar', description: 'Praktik dasar massage: mengenal anatomi tubuh, gerakan dasar, dan aplikasi pada area tubuh.', type: 'layanan' }
  ];

  function initProduk() {
    const grid = $('#produk-grid');
    const filterBox = $('#produk-filter');
    if (!grid) return;
    let items = DEFAULT_PRODUK;
    let active = 'Semua';

    function renderFilter() {
      const programs = ['Semua', ...Array.from(new Set(items.map((i) => i.program)))];
      filterBox.innerHTML = '';
      programs.forEach((p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = p;
        b.setAttribute('aria-pressed', String(p === active));
        b.addEventListener('click', () => { active = p; renderFilter(); renderGrid(); });
        filterBox.appendChild(b);
      });
    }

    function renderGrid() {
      const list = items.filter((i) => active === 'Semua' || i.program === active);
      grid.innerHTML = '';
      list.forEach((it) => {
        const isService = it.type === 'layanan';
        const text = isService
          ? `Halo SLB Negeri Tompokersan Lumajang, saya ingin menanyakan layanan: ${it.name} (program ${it.program}).`
          : `Halo SLB Negeri Tompokersan Lumajang, saya tertarik dengan karya siswa: ${it.name} (program ${it.program}).`;
        const media = it.image
          ? `<img src="${esc(it.image)}" alt="${esc(it.name)}" loading="lazy">`
          : `<span aria-hidden="true">${esc(it.icon || '🛠️')}</span>`;
        const price = it.price ? `<span class="produk-card__price">${esc(it.price)}</span>` : '';
        const card = document.createElement('article');
        card.className = 'produk-card';
        card.innerHTML =
          `<div class="produk-card__media">${media}${price}</div>` +
          `<div class="produk-card__body"><span class="produk-card__program">${esc(it.program)}</span>` +
          `<h4>${esc(it.name)}</h4><p>${esc(it.description || '')}</p>` +
          `<a class="btn btn--primary btn--sm" href="${waLink(text)}" target="_blank" rel="noopener">💬 ${isService ? 'Tanya Layanan' : 'Pesan / Tanya Karya'}</a></div>`;
        grid.appendChild(card);
      });
      if (!list.length) grid.innerHTML = '<p class="sosmed-empty">Belum ada karya pada program ini.</p>';
    }

    renderFilter(); renderGrid();
    fetch('data/produk.json')
      .then((res) => { if (!res.ok) throw new Error('gagal memuat'); return res.json(); })
      .then((data) => {
        const list = (data.items || []).filter((i) => i && i.name && i.program && !String(i.name).includes('CONTOH'));
        if (list.length) { items = list; active = 'Semua'; renderFilter(); renderGrid(); }
      })
      .catch(() => { /* tetap pakai daftar bawaan */ });
  }

  /* ---------- Jalankan ---------- */
  initSkrining();
  initChecklist();
  initSensory();
  initTranslator();
  initProduk();
})();
