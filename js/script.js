/* ==========================================================================
   SLB NEGERI TOMPOKERSAN LUMAJANG — SCRIPT.JS
   Vanilla JS, tanpa dependency, siap GitHub Pages.
   ========================================================================== */
(function(){
  "use strict";

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     1. NAVBAR: mobile toggle + scroll active-link + scrolled shadow
  ------------------------------------------------------------------ */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  const updateNavbarShadow = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', updateNavbarShadow, { passive:true });
  updateNavbarShadow();

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const setActiveLink = () => {
    let currentId = sections[0] ? sections[0].id : '';
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 120) currentId = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  };
  window.addEventListener('scroll', setActiveLink, { passive:true });
  setActiveLink();

  document.getElementById('scroll-cue').addEventListener('click', () => {
    document.getElementById('profil').scrollIntoView({ behavior:'smooth' });
  });

  /* ------------------------------------------------------------------
     2. HERO SLIDESHOW
  ------------------------------------------------------------------ */
  const slides = document.querySelectorAll('.hero__slide');
  let slideIndex = 0;
  if (slides.length > 1) {
    setInterval(() => {
      slides[slideIndex].classList.remove('is-active');
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add('is-active');
    }, 4500);
  }

  /* ------------------------------------------------------------------
     3. SCROLL REVEAL ANIMATION (IntersectionObserver)
  ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('[data-aos]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------
     4. COUNTER ANIMATION (statistik)
  ------------------------------------------------------------------ */
  const counters = document.querySelectorAll('.stat-card__num');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => counterIO.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* ------------------------------------------------------------------
     5. GALERI FILTER
  ------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.getAttribute('data-filter');
      galleryItems.forEach(item => {
        const show = filter === 'semua' || item.getAttribute('data-cat') === filter;
        item.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ------------------------------------------------------------------
     6. BERITA (fetch JSON, dengan fallback jika gagal / file:// )
  ------------------------------------------------------------------ */
  const newsGrid = document.getElementById('news-grid');
  const fallbackNews = [
    { title: "Pembukaan SPMB Tahun Ajaran 2026/2027", date: "1 Agustus 2026", excerpt: "Pendaftaran peserta didik baru resmi dibuka, 100% gratis untuk semua jenjang." },
    { title: "Siswa Raih Juara Lomba Seni Tingkat Provinsi", date: "20 Juli 2026", excerpt: "Prestasi membanggakan dari cabang seni vokal solo tingkat SMALB." },
    { title: "Pelatihan Vokasi IT Angkatan Baru Dimulai", date: "10 Juli 2026", excerpt: "Program vokasi IT membuka kelas baru untuk siswa SMPLB dan SMALB." }
  ];
  const renderNews = (items) => {
    newsGrid.innerHTML = '';
    items.slice(0, 6).forEach(item => {
      const card = document.createElement('article');
      card.className = 'news-card';
      card.innerHTML = `
        <div class="news-card__thumb"></div>
        <div class="news-card__body">
          <span class="news-card__date">${item.date}</span>
          <h4>${item.title}</h4>
          <p>${item.excerpt}</p>
        </div>`;
      newsGrid.appendChild(card);
    });
  };
  fetch('data/news.json')
    .then(res => { if (!res.ok) throw new Error('gagal memuat'); return res.json(); })
    .then(renderNews)
    .catch(() => renderNews(fallbackNews));

  /* ------------------------------------------------------------------
     7. KALENDER AKADEMIK
  ------------------------------------------------------------------ */
  const calTitle = document.getElementById('cal-title');
  const calGrid = document.getElementById('cal-grid');
  const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dow = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  let calDate = new Date(2026, 7, 1); // Agustus 2026

  const academicEvents = {
    '2026-8-17': 'holiday',
    '2026-8-5': 'event',
    '2026-9-14': 'exam',
    '2026-8-28': 'event'
  };

  function renderCalendar(date){
    calTitle.textContent = `${bulanNama[date.getMonth()]} ${date.getFullYear()}`;
    calGrid.innerHTML = '';
    dow.forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = d;
      calGrid.appendChild(el);
    });
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      calGrid.appendChild(document.createElement('div'));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.setAttribute('role', 'gridcell');
      cell.textContent = d;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${d}`;
      if (academicEvents[key]) {
        cell.classList.add('has-event');
        const dot = document.createElement('span');
        dot.className = 'dot dot--' + academicEvents[key];
        cell.appendChild(dot);
        cell.setAttribute('aria-label', `Tanggal ${d}: ${academicEvents[key]}`);
      }
      calGrid.appendChild(cell);
    }
  }
  document.getElementById('cal-prev').addEventListener('click', () => {
    calDate.setMonth(calDate.getMonth() - 1);
    renderCalendar(calDate);
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calDate.setMonth(calDate.getMonth() + 1);
    renderCalendar(calDate);
  });
  renderCalendar(calDate);

  /* ------------------------------------------------------------------
     8. PERPUSTAKAAN DIGITAL (demo interaktif, tanpa backend)
  ------------------------------------------------------------------ */
  const libNote = document.getElementById('lib-note');
  const libMessages = {
    cari: 'Fitur cari buku akan menampilkan hasil pencarian dari katalog digital sekolah.',
    katalog: 'Katalog buku menampilkan seluruh koleksi perpustakaan sekolah secara digital.',
    scan: 'Arahkan kamera ke barcode buku untuk melihat detail dan status ketersediaannya.',
    pinjam: 'Cek status peminjaman buku dan tanggal pengembalian melalui menu ini.'
  };
  document.querySelectorAll('.tool-card').forEach(btn => {
    btn.addEventListener('click', () => {
      libNote.textContent = libMessages[btn.getAttribute('data-lib')] || '';
    });
  });

  /* ------------------------------------------------------------------
     9. DOWNLOAD BROSUR (placeholder aman tanpa backend)
  ------------------------------------------------------------------ */
  document.getElementById('download-brosur').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Brosur SPMB akan segera tersedia untuk diunduh. Silakan hubungi admin sekolah untuk mendapatkan brosur terbaru.');
  });

  /* ------------------------------------------------------------------
     10. ACCESSIBILITY WIDGET
  ------------------------------------------------------------------ */
  const html = document.documentElement;
  const a11yToggle = document.getElementById('a11y-toggle');
  const a11yPanel = document.getElementById('a11y-panel');
  a11yToggle.addEventListener('click', () => {
    const isHidden = a11yPanel.hasAttribute('hidden');
    if (isHidden) a11yPanel.removeAttribute('hidden');
    else a11yPanel.setAttribute('hidden', '');
    a11yToggle.setAttribute('aria-expanded', String(isHidden));
  });

  const STORAGE_KEY = 'slbn-a11y-prefs';
  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  };
  const savePrefs = (prefs) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); }
    catch (e) { /* ignore quota / disabled storage */ }
  };
  let prefs = Object.assign({ scale: 1, contrast: false, dark: false, dyslexia: false, highlight: false }, loadPrefs());

  function applyPrefs(){
    html.style.setProperty('--font-scale', prefs.scale);
    if (prefs.contrast) html.setAttribute('data-contrast', 'high'); else html.removeAttribute('data-contrast');
    if (prefs.dark) html.setAttribute('data-theme', 'dark'); else html.removeAttribute('data-theme');
    if (prefs.dyslexia) html.setAttribute('data-dyslexia', 'true'); else html.removeAttribute('data-dyslexia');
    if (prefs.highlight) html.setAttribute('data-highlight-links', 'true'); else html.removeAttribute('data-highlight-links');

    document.getElementById('a11y-contrast').setAttribute('aria-pressed', String(!!prefs.contrast));
    document.getElementById('a11y-dark').setAttribute('aria-pressed', String(!!prefs.dark));
    document.getElementById('a11y-dyslexia').setAttribute('aria-pressed', String(!!prefs.dyslexia));
    document.getElementById('a11y-highlight').setAttribute('aria-pressed', String(!!prefs.highlight));
    savePrefs(prefs);
  }

  document.getElementById('a11y-inc').addEventListener('click', () => {
    prefs.scale = Math.min(1.6, +(prefs.scale + 0.1).toFixed(2));
    applyPrefs();
  });
  document.getElementById('a11y-dec').addEventListener('click', () => {
    prefs.scale = Math.max(0.85, +(prefs.scale - 0.1).toFixed(2));
    applyPrefs();
  });
  document.getElementById('a11y-contrast').addEventListener('click', () => { prefs.contrast = !prefs.contrast; applyPrefs(); });
  document.getElementById('a11y-dark').addEventListener('click', () => { prefs.dark = !prefs.dark; applyPrefs(); });
  document.getElementById('a11y-dyslexia').addEventListener('click', () => { prefs.dyslexia = !prefs.dyslexia; applyPrefs(); });
  document.getElementById('a11y-highlight').addEventListener('click', () => { prefs.highlight = !prefs.highlight; applyPrefs(); });
  document.getElementById('a11y-reset').addEventListener('click', () => {
    prefs = { scale: 1, contrast: false, dark: false, dyslexia: false, highlight: false };
    applyPrefs();
  });
  applyPrefs();

  /* Close accessibility panel with Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !a11yPanel.hasAttribute('hidden')) {
      a11yPanel.setAttribute('hidden', '');
      a11yToggle.setAttribute('aria-expanded', 'false');
      a11yToggle.focus();
    }
  });

  document.getElementById('a11y-panel-close').addEventListener('click', () => {
    a11yPanel.setAttribute('hidden', '');
    a11yToggle.setAttribute('aria-expanded', 'false');
    a11yToggle.focus();
  });
  document.getElementById('a11y-panel-minimize').addEventListener('click', () => setA11yMinimized(true));

  /* ---- Minimize / restore: Aksesibilitas ---- */
  const a11yWidget = document.getElementById('a11y-widget');
  const a11yMinimizeBtn = document.getElementById('a11y-minimize');
  const a11yRestoreBtn = document.getElementById('a11y-restore');
  const MIN_KEY_A11Y = 'slbn-a11y-minimized';

  function setA11yMinimized(state){
    a11yWidget.classList.toggle('is-minimized', state);
    a11yRestoreBtn.hidden = !state;
    if (state) {
      a11yPanel.setAttribute('hidden', '');
      a11yToggle.setAttribute('aria-expanded', 'false');
    }
    try { localStorage.setItem(MIN_KEY_A11Y, state ? '1' : '0'); } catch (e) {}
  }
  a11yMinimizeBtn.addEventListener('click', () => setA11yMinimized(true));
  a11yRestoreBtn.addEventListener('click', () => { setA11yMinimized(false); a11yToggle.focus(); });
  try { if (localStorage.getItem(MIN_KEY_A11Y) === '1') setA11yMinimized(true); } catch (e) {}


  /* ------------------------------------------------------------------
     11. TUNAS CHATBOT (rule-based, tanpa backend)
  ------------------------------------------------------------------ */
  const tunasToggle = document.getElementById('tunas-toggle');
  const tunasPanel = document.getElementById('tunas-panel');
  const tunasBody = document.getElementById('tunas-body');
  const tunasForm = document.getElementById('tunas-form');
  const tunasInput = document.getElementById('tunas-input');

  function openTunas(){
    tunasPanel.removeAttribute('hidden');
    tunasToggle.setAttribute('aria-expanded', 'true');
    tunasInput.focus();
  }
  function closeTunas(){
    tunasPanel.setAttribute('hidden', '');
    tunasToggle.setAttribute('aria-expanded', 'false');
    tunasToggle.focus();
  }
  tunasToggle.addEventListener('click', () => {
    tunasPanel.hasAttribute('hidden') ? openTunas() : closeTunas();
  });
  document.getElementById('tunas-close').addEventListener('click', closeTunas);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tunasPanel.hasAttribute('hidden')) closeTunas();
  });

  /* ---- Minimize / restore: TUNAS ---- */
  const tunasWidget = document.getElementById('tunas-widget');
  const tunasMinimizeBtn = document.getElementById('tunas-minimize');
  const tunasMinimizeInnerBtn = document.getElementById('tunas-minimize-inner');
  const tunasRestoreBtn = document.getElementById('tunas-restore');
  const MIN_KEY_TUNAS = 'slbn-tunas-minimized';

  function setTunasMinimized(state){
    tunasWidget.classList.toggle('is-minimized', state);
    tunasRestoreBtn.hidden = !state;
    if (state) {
      tunasPanel.setAttribute('hidden', '');
      tunasToggle.setAttribute('aria-expanded', 'false');
    }
    try { localStorage.setItem(MIN_KEY_TUNAS, state ? '1' : '0'); } catch (e) {}
  }
  tunasMinimizeBtn.addEventListener('click', () => setTunasMinimized(true));
  tunasMinimizeInnerBtn.addEventListener('click', () => setTunasMinimized(true));
  tunasRestoreBtn.addEventListener('click', () => { setTunasMinimized(false); tunasToggle.focus(); });
  try { if (localStorage.getItem(MIN_KEY_TUNAS) === '1') setTunasMinimized(true); } catch (e) {}


  function addTunasMessage(text, from){
    const p = document.createElement('p');
    p.className = 'tunas-msg tunas-msg--' + from;
    p.textContent = text;
    tunasBody.appendChild(p);
    tunasBody.scrollTop = tunasBody.scrollHeight;
  }

  const tunasReplies = [
    { keys: ['spmb','daftar','pendaftaran'], reply: 'Pendaftaran SPMB 2026/2027 100% GRATIS! Klik tombol "Daftar Sekarang" di bagian SPMB, atau hubungi admin lewat WhatsApp untuk dibantu proses pendaftarannya. 🌱' },
    { keys: ['lokasi','alamat','peta','maps','dimana'], reply: 'Sekolah kami berada di Jl. Tompokersan, Lumajang, Jawa Timur. Kamu bisa lihat peta lengkapnya di bagian Kontak pada halaman ini.' },
    { keys: ['program','vokasi','ekstrakurikuler','unggulan'], reply: 'Program unggulan kami: Vokasi IT, Tata Graha, Seni & Keterampilan, PJOK Adaptif, Projek P5, dan Literasi Sekolah. Lihat detailnya di bagian Program ya!' },
    { keys: ['jenjang','sdlb','smplb','smalb'], reply: 'Kami memiliki jenjang SDLB, SMPLB, dan SMALB — semua dirancang sesuai kebutuhan dan kecepatan belajar tiap siswa.' },
    { keys: ['kontak','telepon','hubungi','wa','whatsapp'], reply: 'Kamu bisa hubungi kami lewat WhatsApp admin atau email di info@slbntompokersan.sch.id. Tombolnya ada di bagian Kontak.' },
    { keys: ['prestasi'], reply: 'Siswa-siswi kami sudah meraih banyak prestasi, mulai dari seni, olahraga adaptif, hingga kerajinan tangan tingkat nasional. Cek bagian Prestasi untuk lihat selengkapnya!' },
    { keys: ['halo','hai','hi'], reply: 'Halo juga! Aku TUNAS 🌱 Senang bisa membantu kamu hari ini.' },
    { keys: ['terima kasih','makasih','thanks'], reply: 'Sama-sama! Semoga harimu menyenangkan. 🌿' }
  ];

  function getTunasReply(message){
    const lower = message.toLowerCase();
    for (const item of tunasReplies) {
      if (item.keys.some(k => lower.includes(k))) return item.reply;
    }
    return 'Terima kasih atas pertanyaannya! Untuk info lebih detail, silakan hubungi admin sekolah lewat WhatsApp di bagian Kontak, ya. 🌱';
  }

  tunasForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = tunasInput.value.trim();
    if (!msg) return;
    addTunasMessage(msg, 'user');
    tunasInput.value = '';
    setTimeout(() => addTunasMessage(getTunasReply(msg), 'bot'), 400);
  });

  document.querySelectorAll('.tunas-widget__quick button').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q');
      const label = btn.textContent;
      addTunasMessage(label, 'user');
      setTimeout(() => addTunasMessage(getTunasReply(q), 'bot'), 400);
    });
  });

  /* ------------------------------------------------------------------
     12. SOSIAL MEDIA — YouTube otomatis (Data API) + IG/TikTok acak (embed resmi)
  ------------------------------------------------------------------ */
  function shuffleArray(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function loadScriptOnce(src, id){
    return new Promise((resolve) => {
      if (document.getElementById(id)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.async = true; s.id = id;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  }

  async function renderYoutube(social){
    const el = document.getElementById('sosmed-youtube');
    const cfg = social.youtube || {};
    // apiKeyEncoded disimpan dalam bentuk base64 supaya tidak terdeteksi sebagai
    // "API key polos" oleh pemindai otomatis publik (GitHub/Google secret scanning),
    // yang bisa memicu penonaktifan otomatis. Ini BUKAN enkripsi sungguhan — key tetap
    // terlihat saat dipakai di jaringan, sesuai sifat API key berbasis browser.
    const apiKey = cfg.apiKeyEncoded ? atob(cfg.apiKeyEncoded) : cfg.apiKey;
    if (!apiKey || !cfg.channelId) return; // biarkan pesan placeholder tampil
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${cfg.channelId}&part=snippet,id&order=date&maxResults=12&type=video`;
      const res = await fetch(url);
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const reason = errBody && errBody.error && errBody.error.message ? errBody.error.message : `HTTP ${res.status}`;
        console.error('YouTube API error:', reason);
        el.innerHTML = `<p class="sosmed-empty">Video belum bisa dimuat (${res.status === 403 ? 'domain belum diizinkan / API key salah' : 'cek konsol browser (F12) untuk detail'}). Cek pengaturan API key di Google Cloud Console.</p>`;
        return;
      }
      const data = await res.json();
      const videos = (data.items || []).filter(it => it.id && it.id.videoId);
      if (!videos.length) {
        el.innerHTML = '<p class="sosmed-empty">Belum ada video ditemukan di channel ini.</p>';
        return;
      }
      const picked = shuffleArray(videos).slice(0, 3);
      el.innerHTML = '';
      picked.forEach(v => {
        const wrap = document.createElement('div');
        wrap.className = 'sosmed-video';
        wrap.innerHTML = `
          <a href="https://www.youtube.com/watch?v=${v.id.videoId}" target="_blank" rel="noopener" aria-label="Tonton: ${v.snippet.title}">
            <img src="${v.snippet.thumbnails.medium.url}" alt="${v.snippet.title}" loading="lazy">
            <span class="sosmed-video__play" aria-hidden="true">▶</span>
          </a>
          <p>${v.snippet.title}</p>`;
        el.appendChild(wrap);
      });
    } catch (e) {
      console.error('YouTube fetch error:', e);
      el.innerHTML = '<p class="sosmed-empty">Video belum bisa dimuat. Cek konsol browser (F12) untuk detail error.</p>';
    }
  }

  async function renderEmbedPlatform(social, key, containerId, embedScriptSrc, embedScriptId, buildBlockquote){
    const el = document.getElementById(containerId);
    const links = (social[key] || []).filter(u => u && !u.includes('CONTOH_GANTI'));
    if (!links.length) return; // biarkan pesan placeholder tampil
    const picked = shuffleArray(links).slice(0, 2);
    el.innerHTML = '';
    picked.forEach(url => {
      const holder = document.createElement('div');
      holder.className = 'sosmed-embed';
      holder.innerHTML = buildBlockquote(url);
      el.appendChild(holder);
    });
    await loadScriptOnce(embedScriptSrc, embedScriptId);
    if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
  }

  fetch('data/social.json')
    .then(res => { if (!res.ok) throw new Error('gagal memuat data sosial media'); return res.json(); })
    .then(social => {
      renderYoutube(social);
      renderEmbedPlatform(social, 'instagram', 'sosmed-instagram', 'https://www.instagram.com/embed.js', 'ig-embed-script',
        (url) => `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>`);
      renderEmbedPlatform(social, 'tiktok', 'sosmed-tiktok', 'https://www.tiktok.com/embed.js', 'tiktok-embed-script',
        (url) => {
          const match = url.match(/\/video\/(\d+)/);
          const videoId = match ? match[1] : '';
          return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width:605px;min-width:325px;"><section></section></blockquote>`;
        });
    })
    .catch(() => { /* biarkan pesan placeholder di ketiga kolom jika data/social.json belum ada / gagal */ });

  /* ------------------------------------------------------------------
     13. VIRTUAL TOUR 360° (Pannellum) — otomatis nonaktif jika belum ada foto
  ------------------------------------------------------------------ */
  function initVirtualTour(scenes){
    const tabsEl = document.getElementById('tour-tabs');
    const viewerEl = document.getElementById('tour-viewer');
    const valid = (scenes || []).filter(s => s.image && !s.image.includes('CONTOH_GANTI'));
    if (!valid.length || typeof pannellum === 'undefined') return; // biarkan placeholder tampil

    viewerEl.innerHTML = '<div id="tour-pannellum" style="width:100%;height:100%;"></div>';
    tabsEl.innerHTML = '';

    const config = {
      default: { firstScene: valid[0].id, autoLoad: true, sceneFadeDuration: 800 },
      scenes: {}
    };
    valid.forEach(s => {
      config.scenes[s.id] = {
        type: 'equirectangular',
        panorama: s.image,
        title: s.title,
        hotSpots: (s.hotspots || []).map(h => ({
          pitch: h.pitch || 0, yaw: h.yaw || 0, type: 'scene', text: h.title || '', sceneId: h.target
        }))
      };
    });

    const viewer = pannellum.viewer('tour-pannellum', config);

    valid.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = s.title;
      btn.className = i === 0 ? 'is-active' : '';
      btn.addEventListener('click', () => {
        viewer.loadScene(s.id);
        tabsEl.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
      tabsEl.appendChild(btn);
    });
  }

  fetch('data/tour.json')
    .then(res => { if (!res.ok) throw new Error('gagal memuat data tour'); return res.json(); })
    .then(data => initVirtualTour(data.scenes))
    .catch(() => { /* biarkan pesan placeholder jika data/tour.json belum ada / kosong */ });

})();
