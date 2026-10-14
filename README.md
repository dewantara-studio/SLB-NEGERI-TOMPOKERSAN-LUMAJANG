# Website Resmi SLB Negeri Tompokersan Lumajang

Website statis (HTML/CSS/JS murni, tanpa backend) untuk SLB Negeri Tompokersan Lumajang. Siap diunggah ke **GitHub Pages**.

## Struktur Folder

```
slbn-tompokersan/
├── index.html          # Halaman utama (semua section: hero, profil, program, prestasi, berita, SPMB, kontak, dll)
├── css/
│   ├── style.css       # Seluruh styling, dark mode, high contrast, responsive
│   └── inklusi.css     # Styling fitur layanan inklusi
├── js/
│   ├── script.js       # Navbar, slideshow, counter, kalender, chatbot TUNAS, widget aksesibilitas
│   └── inklusi.js      # Skrining mandiri, ruang Snoezelen + nada penenang, Braille & SIBI, e-katalog vokasi
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

## Fitur Layanan Inklusi

Semua fitur ini berjalan di browser (tanpa backend) dan mengikuti dark mode / kontras tinggi.

| Bagian di halaman | Isi |
|---|---|
| **Layanan** (`#layanan`) | Program Layanan Kekhususan (autisme, tunagrahita, tunarungu, tunanetra, tunadaksa, tunaganda) |
| **Karya Vokasi** (`#karya-vokasi`) | E-Katalog Karya & Produk Siswa Vokasi, tombol pesan membuka WhatsApp admin |
| **Skrining** (`#skrining`) | Modul skrining awal mandiri 3 tahap + Check-List Indikator Deteksi Dini |
| **Multisensori** (`#multisensori`) | Ruang Snoezelen interaktif + Mode Suasana Penenang (warna, kecepatan, nada latar) |
| **Braille & SIBI** (`#braille-sibi`) | Penerjemah visual Braille (A-Z) dan abjad isyarat SIBI |

**E-Katalog** - edit `data/produk.json`. Tiap item punya `program`, `name`, `description`, dan opsional `type` (`karya`/`layanan`), `icon`, `image`, `price`. Selama `items` kosong, situs menampilkan 7 kartu bawaan (satu per program vokasi, tanpa harga). Tambahkan foto ke `assets/img/produk/` lalu isi `image`.

**Abjad isyarat SIBI** - taruh 26 gambar resmi `a.png` sampai `z.png` di `assets/img/sibi/` (lihat `BACA-INI.txt` di folder itu). Gambar sengaja tidak dibuat otomatis agar isyarat yang ditampilkan akurat. Sebelum gambar dipasang, pengunjung melihat pesan "sedang disiapkan".

**Catatan penting**
- Skrining mandiri dan check-list hanya memberi gambaran awal dan **bukan diagnosis**; teks penafian sudah dicantumkan di halaman.
- Nada latar di ruang multisensori hanya gelombang sinus lembut untuk relaksasi, bukan terapi medis.
- Tombol "Kirim hasil ke admin" membuka WhatsApp dengan ringkasan jawaban; tidak ada data yang dikirim otomatis atau disimpan di server.
- Periksa kembali daftar jenis layanan di bagian Layanan agar sesuai dengan layanan yang benar-benar tersedia di sekolah.

## Menghubungkan Sosial Media (YouTube, Instagram, TikTok)

Section "Sosmed" di beranda mengambil data dari `data/social.json`. Edit file itu untuk mengisi konten:

**Instagram & TikTok** — tempel link postingan/video ke dalam array `instagram` dan `tiktok` (boleh lebih dari satu, pisahkan dengan koma). Situs akan otomatis mengacak dan menampilkan 2 dari daftar tersebut setiap kali dibuka, memakai widget resmi (embed.js) dari masing-masing platform — bukan scraping, jadi aman dan sesuai kebijakan mereka. Tambahkan link baru kapan saja tanpa perlu koding.

**YouTube** — bisa 100% otomatis (tanpa update manual) memakai YouTube Data API v3:
1. Buka [Google Cloud Console](https://console.cloud.google.com/), buat project baru (gratis).
2. Aktifkan **YouTube Data API v3** di menu "APIs & Services".
3. Buat **API Key** di menu "Credentials", lalu batasi key tersebut hanya untuk domain situs sekolah (HTTP referrer) supaya aman.
4. Cari Channel ID sekolah (bukan @handle) — bisa dilihat di halaman "About" channel YouTube atau lewat situs pencari Channel ID gratis.
5. Isi `channelId` pada bagian `youtube` di `data/social.json`.
6. **Penting**: jangan tempel API key dalam bentuk polos (`AIzaSy...`) ke `apiKey` — Google otomatis menonaktifkan key yang terdeteksi ada di repository publik. Sebagai gantinya, encode dulu ke base64, lalu tempel hasilnya ke field `apiKeyEncoded`. Cara encode paling gampang: buka Console browser (F12) di halaman mana saja, ketik `btoa("APIKEYKAMU")`, tekan Enter, salin hasilnya (diapit tanda kutip, tanda kutipnya tidak usah ikut disalin).

Setelah diisi, video terbaru dari channel akan tampil otomatis dan teracak setiap kunjungan, tanpa perlu update manual lagi. Catatan: ini bukan enkripsi sungguhan (siapa pun yang membuka DevTools tetap bisa melihat key aslinya saat dipakai) — tujuannya hanya menghindari pemindaian otomatis yang mencari pola teks API key polos, supaya key tidak otomatis dinonaktifkan Google lagi.

## Konten yang Perlu Disesuaikan
- Ganti nomor WhatsApp (`6281234567890`), email, dan alamat pada `index.html` dengan data resmi sekolah.
- Ganti placeholder foto (kepala sekolah, dsb.) dengan foto asli sekolah.
- Perbarui `data/news.json` secara berkala untuk berita terbaru tanpa perlu menyentuh kode.
- Sesuaikan jumlah statistik (`data-count`) di bagian Statistik pada `index.html`.
- Tambahkan link Instagram, brosur PDF, dan tautan Google Maps yang sebenarnya.

## Fitur Aksesibilitas
Tombol aksesibilitas melayang di kanan bawah menyediakan: perbesar/perkecil teks, mode kontras tinggi, mode gelap, font ramah disleksia, sorot tautan, indikator fokus keyboard, skip-to-content, dan struktur ARIA label. Preferensi pengguna disimpan di `localStorage` browser.

## Maskot & Chatbot TUNAS
Tombol hijau melayang di kiri bawah membuka chatbot **TUNAS** — asisten berbasis aturan kata kunci (rule-based, tanpa API/backend) yang menjawab pertanyaan seputar SPMB, lokasi, program, dan kontak sekolah. Untuk chatbot berbasis AI yang lebih pintar, `js/script.js` bisa dikembangkan lebih lanjut untuk terhubung ke API pihak ketiga.

## Lisensi
Bebas digunakan dan dikembangkan oleh SLB Negeri Tompokersan Lumajang.
