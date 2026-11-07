// Uji mesin TUNAS. Jalankan: node tests/tunas-engine.test.js
const fs = require('fs');
const path = require('path');
const { createEngine } = require('../js/tunas-engine.js');
const kb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/tunas-kb.json'), 'utf8'));
const E = createEngine(kb);

let pass = 0, fail = 0;
const check = (label, ok, detail) => { if (ok) pass++; else { fail++; console.log('GAGAL:', label, '->', detail); } };
const dec = (q) => E.decide(q, E.newContext());

// ---- pertanyaan tunggal -> entri yang diharapkan
const single = [
  ['bagaimana cara daftar?', 'spmb'], ['mau mendaftar gimana ya', 'spmb'], ['pendaftran spmb', 'spmb'], ['SPMB 2026', 'spmb'],
  ['berapa biaya sekolahnya?', 'biaya'], ['apakah gratis', 'biaya'], ['brp bayarnya', 'biaya'],
  ['apa saja syarat pendaftaran', 'syarat'], ['kapan pendaftaran dibuka', 'syarat'], ['dokumen apa yang dibutuhkan', 'syarat'],
  ['dimana alamat sekolah', 'lokasi'], ['alamt sekolahnya dmn', 'lokasi'], ['minta lokasi dong', 'lokasi'],
  ['nomor wa sekolah', 'kontak'], ['email sekolah apa', 'kontak'], ['instagram sekolah', 'kontak'],
  ['saya mau bicara dengan bu hesti', 'cs'], ['bisa ngobrol sama admin', 'cs'], ['hubungi bu hesti', 'cs'], ['mau telepon manusia asli', 'cs'],
  ['ada layanan tunarungu?', 'layanan'], ['apa saja layanan untuk anak berkebutuhan khusus', 'layanan'],
  ['jenjang apa saja', 'jenjang'], ['ada smalb?', 'jenjang'],
  ['program vokasi apa saja', 'vokasi'], ['ada tata boga', 'vokasi'], ['ada pelatihan cuci motor', 'vokasi'],
  ['ekskul apa saja', 'ekskul'], ['ada pramuka?', 'ekskul'], ['ada drumband', 'ekskul'],
  ['siapa kepala sekolahnya', 'kepsek'], ['sejarah sekolah ini', 'profil'], ['kapan sekolah berdiri', 'profil'],
  ['apa visi dan misi sekolah', 'visimisi'], ['jumlah guru berapa', 'data'], ['berapa jumlah siswa', 'data'],
  ['prestasi sekolah apa saja', 'prestasi'], ['ada yang juara lomba?', 'prestasi'],
  ['apa itu skrining', 'skrining'], ['deteksi dini tumbuh kembang', 'skrining'],
  ['apa itu snoezelen', 'snoezelen'], ['ruang multisensori', 'snoezelen'], ['mode suasana penenang', 'snoezelen'],
  ['apa itu braille', 'braille'], ['abjad isyarat sibi', 'braille'],
  ['mau beli produk siswa', 'karya'], ['katalog karya', 'karya'],
  ['perpustakaan digital', 'perpus'], ['ada game edukasi?', 'gim'], ['berita terbaru', 'berita'],
  ['kapan libur sekolah', 'kalender'], ['font untuk disleksia ada?', 'aksesibilitas'], ['cara perbesar teks', 'aksesibilitas'],
  ['ada asrama?', 'belum'], ['ada antar jemput', 'belum'], ['seragamnya gimana', 'belum'], ['ada terapi wicara?', 'belum'],
  ['anak diejek temannya, bullying', 'bullying'], ['kamu siapa', 'tunas'], ['kamu robot ya', 'tunas'],
  ['harga seragam berapa', 'belum'], ['siapa nama kepala sekolahnya', 'kepsek'], ['dapat medali apa saja', 'prestasi'],
  ['bagaimana mendaftarkan adik', 'spmb'], ['biayanya berapa ya', 'biaya']
];
for (const [q, id] of single) { const r = dec(q); check(q, r.entryId === id, `dapat ${r.type}/${r.entryId}, harusnya ${id}`); }

// ---- sapaan, terima kasih, di luar topik
check('halo -> greeting', dec('halo').type === 'greeting', '');
check('selamat pagi bu -> greeting', dec('selamat pagi bu').type === 'greeting', '');
check('assalamualaikum wr wb -> greeting', dec('assalamualaikum wr wb').type === 'greeting', '');
check('makasih -> thanks', dec('makasih ya').type === 'thanks', '');
check('terima kasih banyak -> thanks', dec('terima kasih banyak').type === 'thanks', '');
check('oke -> ack', dec('oke').type === 'ack', '');
for (const q of ['resep nasi goreng enak', 'siapa presiden indonesia', 'cuaca hari ini bagaimana', 'harga bitcoin']) {
  const r = dec(q);
  check('di luar topik: ' + q, r.type === 'fallback' && r.actions.some((a) => a.wa), `dapat ${r.type}/${r.entryId}`);
}
{ const ctx = E.newContext(); ctx.lastQuestion = 'resep nasi goreng enak';
  const r = E.decide('resep nasi goreng enak', ctx);
  check('fallback WA memuat pertanyaan', r.actions[0].wa.includes('resep nasi goreng enak'), r.actions[0].wa); }

// ---- keselamatan
for (const q of ['saya ingin bunuh diri', 'anak saya ingin mengakhiri hidup', 'anak saya dipukul oleh gurunya', 'anak saya dilecehkan']) {
  const r = dec(q); check('keselamatan: ' + q, r.type === 'safety' && r.actions.length >= 2, `dapat ${r.type}`);
}
check('pertanyaan kebijakan tidak salah dianggap darurat', dec('apakah ada kekerasan di sekolah').type !== 'safety', '');

// ---- alur orang tua (beberapa langkah)
{
  const ctx = E.newContext();
  let r = E.decide('anak saya 7 tahun belum bisa bicara', ctx);
  check('orang tua: usia+kebutuhan langsung ringkasan', r.type === 'parent' && /SDLB/.test(r.text) && /keterlambatan bicara/.test(r.text), r.text.slice(0, 120));
  check('ringkasan memuat penafian/langkah', /bukan diagnosis/.test(r.text) && /dokter anak/.test(r.text) && r.actions.some((a) => a.wa), '');
  check('WA konsultasi memuat usia & kebutuhan', /usia 7 tahun/.test(r.actions.find((a) => a.wa).wa), r.actions.find((a) => a.wa).wa);
  const j = E.decide('jenjang apa saja', ctx);
  check('jawaban jenjang dipersonalisasi usia', /usia 7 tahun/.test(j.text) && /SDLB/.test(j.text), j.text);
}
{
  const ctx = E.newContext();
  let r = E.decide('anak saya sulit mendengar, saya khawatir', ctx);
  check('orang tua: tanya usia dulu', r.type === 'parent' && ctx.awaiting === 'age' && /khawatir/.test(r.text) && r.chips.length >= 5, ctx.awaiting + ' | ' + r.text.slice(0, 80));
  check('kebutuhan tertangkap (hearing)', ctx.need === 'hearing', ctx.need);
  r = E.decide('9 tahun', ctx);
  check('lalu ringkasan SDLB + tunarungu', r.type === 'parent' && /SDLB/.test(r.text) && /BKPBI/.test(r.text), r.text.slice(0, 120));
}
{
  const ctx = E.newContext();
  E.decide('mau tanya soal anak saya', ctx);
  check('alur: tanya usia', ctx.awaiting === 'age', ctx.awaiting);
  let r = E.decide('', ctx, { age: { value: 14, text: '13-15 tahun' } });
  check('chip usia -> tanya kebutuhan', ctx.awaiting === 'need' && r.chips.some((c) => c.need === 'vision'), ctx.awaiting);
  r = E.decide('', ctx, { need: 'unknown' });
  check('belum tahu -> ringkasan SMPLB', r.type === 'parent' && /SMPLB/.test(r.text) && /Tidak apa-apa/.test(r.text), r.text.slice(0, 100));
  r = E.decide('', ctx, { action: 'reset' });
  check('reset memulai ulang', ctx.age === null && ctx.awaiting === 'age' && /dari awal/.test(r.text), ctx.awaiting);
}
{
  const ctx = E.newContext();
  E.decide('anak saya autis', ctx);
  const r = E.decide('', ctx, { action: 'skip' });
  check('lewati usia -> ringkasan tanpa baris jenjang', r.type === 'parent' && /autisme/.test(r.text) && !/jenjang SDLB/.test(r.text), r.text.slice(0, 100));
}
{
  const ctx = E.newContext();
  E.decide('anak saya tunanetra', ctx);
  const r = E.decide('berapa biaya sekolah?', ctx);
  check('pertanyaan lain saat menunggu usia tetap dijawab', r.entryId === 'biaya' && ctx.awaiting === null, `${r.type}/${r.entryId}/${ctx.awaiting}`);
}
check('umur desimal: 2,5 tahun', (() => { const c = E.newContext(); E.decide('anak saya 2,5 tahun tuli', c); return c.age === 2.5; })(), '');
check('umur kata: tujuh tahun', (() => { const c = E.newContext(); E.decide('anak saya tujuh tahun autis', c); return c.age === 7; })(), '');
check('umur bulan: 18 bulan', (() => { const c = E.newContext(); E.decide('anak saya 18 bulan belum bicara', c); return c.age === 1.5; })(), '');
check('tanpa penanda anak, pertanyaan umum tidak masuk alur orang tua', dec('apakah anak tunarungu bisa sekolah di sini').entryId === 'layanan', '');

// ---- integritas keluaran
for (const id of kb.entries.map((e) => e.id)) {
  const r = E.decide('', E.newContext(), { entryId: id });
  check('entri bisa dijawab: ' + id, !!r.text && r.text.length > 20, 'teks kosong');
  for (const c of r.chips || []) check(`chip ${id}->${c.entryId || c.need || c.action || (c.age && c.age.text)}`, !!(c.label && (c.entryId ? E.entryById(c.entryId) : true)), JSON.stringify(c));
}

console.log(`\nSelesai: ${pass} lulus, ${fail} gagal.`);
process.exit(fail ? 1 : 0);
