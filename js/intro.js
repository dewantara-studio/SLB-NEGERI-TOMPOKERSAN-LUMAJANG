/* ==========================================================================
   INTRO.JS - Pembuka video logo reveal (tampil sebelum website).
   Penentu tampil/tidak (sekali per sesi, ?intro=1 paksa tampil, ?intro=0 mati,
   dilewati bila pengguna memilih "kurangi gerakan") ada di <head> index.html.
   Aturan keselamatan/aksesibilitas: video dimulai tanpa suara, ada tombol
   Lewati, suara hanya menyala atas pilihan pengguna, bagian lain halaman
   dinonaktifkan (inert) selama pembuka, dan semua kegagalan (autoplay
   diblokir, video lambat/rusak) langsung membuka website.
   ========================================================================== */
(function () {
  'use strict';

  const START_TIMEOUT = 4500;   // ms: bila video belum mulai diputar, langsung buka website
  const STALL_TIMEOUT = 4500;   // ms: bila video tersendat selama ini, langsung buka website
  const MAX_TOTAL = 14000;      // ms: pengaman terakhir (video asli 8 detik)
  const FADE_MS = 650;

  const root = document.documentElement;
  const overlay = document.getElementById('intro');
  if (!overlay) return;

  if (!root.classList.contains('has-intro')) {   // tidak perlu tampil: buang agar tidak memuat apa pun
    overlay.remove();
    return;
  }

  const video = document.getElementById('intro-video');
  const skipBtn = document.getElementById('intro-skip');
  const soundBtn = document.getElementById('intro-sound');
  const rest = Array.from(document.querySelectorAll('.skip-link, header.navbar, main, footer, .a11y-widget, .tunas-widget'));
  let finished = false, started = false, startTimer = null, stallTimer = null, totalTimer = null;

  try { sessionStorage.setItem('slbn-intro-seen', '1'); } catch (e) { /* penyimpanan tidak tersedia */ }
  rest.forEach((el) => el.setAttribute('inert', ''));

  function clearTimers() { clearTimeout(startTimer); clearTimeout(stallTimer); clearTimeout(totalTimer); }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimers();
    rest.forEach((el) => el.removeAttribute('inert'));
    overlay.classList.add('is-leaving');
    try { video.pause(); } catch (e) { /* abaikan */ }
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { root.classList.remove('has-intro'); overlay.remove(); }, FADE_MS);
  }

  function onKey(e) { if (e.key === 'Escape') finish(); }

  skipBtn.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);

  soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
    soundBtn.textContent = video.muted ? '🔇 Nyalakan suara' : '🔊 Matikan suara';
  });

  video.addEventListener('playing', () => { started = true; clearTimeout(startTimer); clearTimeout(stallTimer); });
  video.addEventListener('waiting', () => { if (started) { clearTimeout(stallTimer); stallTimer = setTimeout(finish, STALL_TIMEOUT); } });
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);

  startTimer = setTimeout(() => { if (!started) finish(); }, START_TIMEOUT);
  totalTimer = setTimeout(finish, MAX_TOTAL);

  try { skipBtn.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }

  video.muted = true;
  video.preload = 'auto';
  const p = video.play();
  if (p && typeof p.catch === 'function') p.catch(finish);   // autoplay diblokir -> langsung buka website
})();
