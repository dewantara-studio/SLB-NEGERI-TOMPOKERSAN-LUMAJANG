# Website Resmi SLB Negeri Tompokersan Lumajang

Website statis (HTML/CSS/JS murni, tanpa backend) untuk SLB Negeri Tompokersan Lumajang. Siap diunggah ke **GitHub Pages**.

## Struktur Folder

```
slbn-tompokersan/
├── index.html          # Halaman utama (semua section: hero, profil, program, prestasi, galeri, berita, SPMB, kontak, dll)
├── css/
│   └── style.css       # Seluruh styling, dark mode, high contrast, responsive
├── js/
│   └── script.js       # Navbar, slideshow, counter, filter galeri, kalender, chatbot TUNAS, widget aksesibilitas
├── data/
│   └── news.json        # Data berita (bisa diedit tanpa perlu koding)
├── assets/
│   └── img/
│       ├── favicon.svg
│       └── og-cover.svg
└── README.md
```

## Cara Menjalankan di Lokal
Cukup buka `index.html` langsung di browser, atau jalankan server statis sederhana:

```bash
npx serve .
# atau
python3 -m http.server
```

## Cara Deploy ke GitHub Pages
1. Buat repository baru di GitHub, misalnya `slbn-tompokersan`.
2. Upload seluruh isi folder ini ke branch `main`.
3. Buka **Settings > Pages** pada repository.
4. Pilih source: branch `main`, folder `/ (root)`.
5. Simpan — situs akan aktif di `https://<username>.github.io/slbn-tompokersan/`.

## Virtual Tour 360°

Section "Virtual Tour" mengambil data dari `data/tour.json`. Situs otomatis menampilkan pesan "segera tersedia" selama file itu masih kosong/contoh — begitu diisi, viewer 360° interaktif langsung aktif (pakai library open-source [Pannellum](https://pannellum.org/), tanpa backend).

**Cara mengambil foto 360°:**
1. Install aplikasi **Google Street View** (gratis, Android/iOS) — atau pakai kamera 360° khusus (Insta360, Ricoh Theta) kalau ada.
2. Di aplikasi, pilih menu kamera → **Foto 360°/Photo Sphere**, lalu putar badan pelan mengikuti panduan di layar sampai satu putaran penuh.
3. Ulangi untuk tiap ruangan/area (halaman depan, ruang kelas, perpustakaan, aula, dll).
4. Simpan hasilnya — formatnya otomatis jadi foto panorama lebar (rasio 2:1).

**Cara menambahkan ke website:**
1. Taruh file foto ke folder `assets/img/tour/` (ada panduan lebih detail di file `BACA-INI.txt` dalam folder itu).
2. Buka `data/tour.json`, tambahkan satu entri untuk tiap foto (id, judul ruangan, nama file).
3. Simpan dan upload — Virtual Tour otomatis aktif, pengunjung bisa putar 360° dan pindah ruangan lewat tab di atas viewer.

Opsional: setiap scene bisa punya `hotspots` (titik yang bisa diklik untuk pindah ke ruangan lain langsung dari dalam foto 360°) — formatnya sudah disiapkan di `tour.json`, tinggal isi `pitch`, `yaw`, `title`, dan `target` (id scene tujuan).

## Menghubungkan Sosial Media (YouTube, Instagram, TikTok)

Section "Sosmed" di beranda mengambil data dari `data/social.json`. Edit file itu untuk mengisi konten:

**Instagram & TikTok** — tempel link postingan/video ke dalam array `instagram` dan `tiktok` (boleh lebih dari satu, pisahkan dengan koma). Situs akan otomatis mengacak dan menampilkan 2 dari daftar tersebut setiap kali dibuka, memakai widget resmi (embed.js) dari masing-masing platform — bukan scraping, jadi aman dan sesuai kebijakan mereka. Tambahkan link baru kapan saja tanpa perlu koding.

**YouTube** — bisa 100% otomatis (tanpa update manual) memakai YouTube Data API v3:
1. Buka [Google Cloud Console](https://console.cloud.google.com/), buat project baru (gratis).
2. Aktifkan **YouTube Data API v3** di menu "APIs & Services".
3. Buat **API Key** di menu "Credentials", lalu batasi key tersebut hanya untuk domain situs sekolah (HTTP referrer) supaya aman.
4. Cari Channel ID sekolah (bukan @handle) — bisa dilihat di halaman "About" channel YouTube atau lewat situs pencari Channel ID gratis.
5. Isi `channelId` dan `apiKey` pada bagian `youtube` di `data/social.json`.

Setelah diisi, video terbaru dari channel akan tampil otomatis dan teracak setiap kunjungan, tanpa perlu update manual lagi.

## Konten yang Perlu Disesuaikan
- Ganti nomor WhatsApp (`6281234567890`), email, dan alamat pada `index.html` dengan data resmi sekolah.
- Ganti placeholder foto (gradasi warna di galeri, kepala sekolah, dsb.) dengan foto asli sekolah.
- Perbarui `data/news.json` secara berkala untuk berita terbaru tanpa perlu menyentuh kode.
- Sesuaikan jumlah statistik (`data-count`) di bagian Statistik pada `index.html`.
- Tambahkan link Instagram, brosur PDF, dan tautan Google Maps yang sebenarnya.

## Fitur Aksesibilitas
Tombol aksesibilitas melayang di kanan bawah menyediakan: perbesar/perkecil teks, mode kontras tinggi, mode gelap, font ramah disleksia, sorot tautan, indikator fokus keyboard, skip-to-content, dan struktur ARIA label. Preferensi pengguna disimpan di `localStorage` browser.

## Maskot & Chatbot TUNAS
Tombol hijau melayang di kiri bawah membuka chatbot **TUNAS** — asisten berbasis aturan kata kunci (rule-based, tanpa API/backend) yang menjawab pertanyaan seputar SPMB, lokasi, program, dan kontak sekolah. Untuk chatbot berbasis AI yang lebih pintar, `js/script.js` bisa dikembangkan lebih lanjut untuk terhubung ke API pihak ketiga.

## Lisensi
Bebas digunakan dan dikembangkan oleh SLB Negeri Tompokersan Lumajang.
