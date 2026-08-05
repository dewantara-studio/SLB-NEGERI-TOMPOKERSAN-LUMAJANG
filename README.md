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
