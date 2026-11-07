# TUNAS: dari asisten berbasis pengetahuan ke AI sungguhan

## Cara kerja sekarang (gratis, tanpa server)

TUNAS menjawab dari **basis pengetahuan sekolah** di `data/tunas-kb.json`:

- Memahami bahasa sehari-hari, singkatan, dan salah ketik ("gimana daftar?", "alamt sekolah").
- Alur khusus orang tua: bertanya usia dan hambatan anak, lalu memberi ringkasan jenjang, layanan terkait,
  dan langkah berikutnya (skrining, dokter/psikolog, konsultasi dengan Bu Hesti). Tidak mendiagnosis.
- Tombol hijau **"Hubungi Bu Hesti (CS)"** selalu tampil. Pertanyaan terakhir (dan usia/kebutuhan anak bila
  sudah diceritakan) otomatis terisi di pesan WhatsApp, jadi Bu Hesti langsung paham.
- Untuk hal yang tidak diketahui (biaya seragam, jam belajar, dst.) TUNAS **tidak mengarang**, melainkan
  mengarahkan ke Bu Hesti.
- Topik keselamatan (menyakiti diri, kekerasan pada anak) dijawab dengan nomor bantuan resmi.

### Mengedit jawaban
Buka `data/tunas-kb.json`, ubah teks `answer` atau tambah entri baru (`id`, `title`, `keywords`, `answer`,
`actions`, `follow`). Setelah mengubah, jalankan `node tests/tunas-engine.test.js` bila ingin memastikan
pencocokannya tetap benar.

## Menambahkan AI sungguhan (opsional, berbayar)

Situs ini statis (GitHub Pages), jadi **kunci API AI tidak boleh ditaruh di kode situs** (siapa pun bisa
mengambilnya dan memakai kuota Anda). Caranya: pasang "proxy" kecil yang menyimpan kunci, lalu isi alamatnya
di `config.aiEndpoint` pada `data/tunas-kb.json`.

Dengan AI aktif, urutannya: **basis pengetahuan dulu** (cepat, gratis, akurat untuk info sekolah); hanya
pertanyaan yang **tidak ada** di basis pengetahuan yang diteruskan ke AI. Jawaban AI diberi catatan "bisa saja
kurang tepat" plus tombol hubungi Bu Hesti.

### Yang perlu disiapkan
1. Akun penyedia AI dengan API key dan saldo (contoh: Anthropic API di console.anthropic.com). **Berbayar per
   pemakaian**; atur batas pengeluaran bulanan di dashboard penyedia.
2. Akun Cloudflare (Workers punya paket gratis) atau layanan serverless lain (Firebase Functions, Vercel, dll.).

### Contoh proxy (Cloudflare Worker)

Buat Worker baru, tempel kode berikut, lalu di Settings > Variables and Secrets tambahkan secret
`ANTHROPIC_API_KEY`. Salin alamat `https://....workers.dev` ke `config.aiEndpoint`.

```js
const ALLOWED_ORIGINS = ['https://dewantara-studio.github.io'];
const MODEL = 'claude-haiku-5-5'; // cek nama model terbaru di dokumentasi penyedia

const SYSTEM_PROMPT = `Kamu adalah TUNAS, asisten otomatis SLB Negeri Tompokersan Lumajang.
Jawab dalam bahasa Indonesia yang ramah, singkat (maksimal sekitar 120 kata), dan mudah dipahami orang tua.
Aturan:
- Hanya gunakan fakta sekolah di bawah. Jika tidak tahu, katakan belum tahu dan arahkan ke Bu Hesti
  (WhatsApp 0813-3388-1251). Jangan mengarang biaya, jadwal, persyaratan, atau layanan.
- Jangan mendiagnosis, jangan memberi saran medis atau obat. Sarankan dokter anak/psikolog bila perlu.
- Jangan menjanjikan anak pasti diterima atau layanan tertentu pasti tersedia.
- Jika ada bahaya langsung: arahkan ke 112; kekerasan pada anak ke SAPA 129; dukungan jiwa ke Healing119 (119 ext. 8).
Fakta sekolah:
- Satu-satunya SLB Negeri di Kota Lumajang; berdiri 1984 (SDLB Tompokersan), jadi SLB Negeri 10 Juli 2018.
- Alamat: Jalan Veteran No. 31, Kelurahan Tompokersan, Kecamatan Lumajang, Kabupaten Lumajang, Jawa Timur.
- Jenjang SDLB, SMPLB, SMALB. Pendaftaran SPMB 2026/2027 100% gratis. 143 peserta didik, 37 guru dan tenaga pendidik.
- Layanan kekhususan: autisme, tunagrahita, tunarungu, tunanetra, tunadaksa, tunaganda.
- Vokasi: Tata Boga, Tata Busana, Tata Graha, IT, Keterampilan Rekayasa, Cuci Motor, Pijat.
- Kepala sekolah Anik Handriyani, S.Pd. Kontak utama: Bu Hesti (WA 0813-3388-1251).`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403, headers: cors });
    }

    let data;
    try { data = await request.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
    const message = String(data.message || '').slice(0, 500).trim();
    if (!message) return new Response('Bad request', { status: 400, headers: cors });

    const history = (Array.isArray(data.history) ? data.history : []).slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 800),
    }));
    while (history.length && history[0].role !== 'user') history.shift();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages: [...history, { role: 'user', content: message }] }),
    });
    if (!res.ok) return new Response(JSON.stringify({ reply: '' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });

    const out = await res.json();
    const reply = (out.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
```

Kontrak antarmuka (bila memakai penyedia/server lain): situs mengirim `POST` JSON
`{ message, history: [{role, content}], context: { age, ageText, need } }` dan mengharapkan balasan
`{ "reply": "teks jawaban" }`. Jika endpoint gagal atau lambat (lebih dari 15 detik), TUNAS otomatis kembali ke
jawaban bawaan + tombol Bu Hesti.

### Hal penting sebelum mengaktifkan
- **Biaya**: setiap pertanyaan di luar basis pengetahuan menghabiskan kuota berbayar. Pasang batas pengeluaran
  bulanan, dan aktifkan rate limiting di Cloudflare (Security > WAF > Rate limiting rules).
- **Keamanan**: pemeriksaan `Origin` hanya menahan penyalahgunaan dari situs lain, bukan dari skrip yang
  memalsukan header. Karena itu batas biaya dan rate limiting tetap wajib.
- **Privasi**: pertanyaan pengunjung (termasuk cerita tentang anak) akan dikirim ke penyedia AI. Ubah teks
  pengingat di panel chat (`index.html`, kelas `tunas-widget__hint`) dan pertimbangkan memberi tahu
  orang tua, terutama karena menyangkut data anak berkebutuhan khusus.
- **Akurasi**: AI bisa keliru. Karena itu prompt melarang diagnosis dan mengarang fakta, tetapi tetap
  periksa jawabannya secara berkala.
