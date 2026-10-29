# 🧾 Program Penjualan Kasir — Web App + Google Sheets

Aplikasi kasir berbasis web yang tersambung ke Google Sheets (lewat Google Apps
Script sebagai API). Bisa diakses dari **laptop maupun smartphone** cukup lewat
browser — tidak perlu install apapun di perangkat.

## Fitur
- ✅ Input stok, tambah barang, tipe/kategori barang
- ✅ Scan barcode lewat kamera HP/laptop, atau scanner fisik USB/Bluetooth
- ✅ Print struk ke printer thermal 58mm (termasuk TM58M)
- ✅ Login dengan akun Admin dan Kasir (role terpisah)
- ✅ Laporan penjualan harian, mingguan, dan bulanan + grafik
- ✅ Harga dan total transaksi tanpa PPN
- ✅ Data tersimpan di Google Sheets — otomatis ter-backup oleh Google

---

## 🚀 LANGKAH SETUP (sekitar 10 menit)

### Langkah 1 — Buat Google Sheet
1. Buka https://sheets.new (akan membuat spreadsheet baru otomatis)
2. Beri nama spreadsheet, misal **"Database Kasir Toko"**

### Langkah 2 — Pasang Backend (Apps Script)
1. Di spreadsheet tadi, klik menu **Extensions → Apps Script**
2. Hapus semua kode default (`function myFunction() {}`)
3. Buka file **`Code.gs`** dari paket ini, copy semua isinya, paste ke editor Apps Script
4. Klik **Save** (ikon disket / Ctrl+S)
5. Di dropdown pilihan function (atas, sebelah tombol Run/Debug), pilih **`setupSheets`**
6. Klik **Run** ▶️
7. Akan muncul popup minta izin — klik **Review permissions** → pilih akun Google kamu → klik **Advanced** → **Go to (nama project) (unsafe)** → **Allow**
   *(Ini normal karena script belum diverifikasi Google, tapi aman karena ini kode milikmu sendiri)*
8. Setelah selesai jalan, cek spreadsheet kamu — akan otomatis muncul tab: `Users`, `Produk`, `Transaksi`, `DetailTransaksi`, `LogAktivitas`

### Langkah 3 — Deploy sebagai Web App
1. Masih di Apps Script, klik tombol **Deploy** (kanan atas) → **New deployment**
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**
3. Isi:
   - Description: `Kasir API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy**
5. **Copy URL** yang muncul (bentuknya seperti `https://script.google.com/macros/s/AKfycb.../exec`)
   → Simpan URL ini, akan dipakai di langkah berikutnya

### Langkah 4 — Buka Aplikasi Web
1. Host **`index.html`** di layanan hosting HTTPS agar dapat dibuka lewat browser laptop dan smartphone. Contohnya, Netlify Drop (https://app.netlify.com/drop) — unggah `index.html`, lalu gunakan link HTTPS yang diberikan.
   - Jangan buka file HTML langsung dari penyimpanan smartphone (`file://`): browser dapat memblokir koneksi lintas-origin ke Google Apps Script (CORS).
2. Saat pertama buka, akan diminta **URL API** — paste URL dari Langkah 3
3. Login dengan akun default:
   - **Admin:** `admin` / `admin123`
   - **Kasir:** `kasir` / `kasir123`
4. **Segera ganti password default**: buka menu Pengguna, klik edit pada akun admin, isi password baru, lalu simpan.

Login menghasilkan sesi sementara di server (berlaku hingga 6 jam). Hak admin/kasir diperiksa oleh API, sehingga pembatasan menu tidak hanya mengandalkan tampilan web.

### Langkah 5 — Akses dari Smartphone
- Setelah di-hosting (Langkah 4), buka link yang sama di browser HP (Chrome/Safari)
- Bisa juga "Add to Home Screen" di HP supaya terlihat seperti aplikasi asli

Di menu Riwayat, pilih tanggal awal dan akhir melalui pemilih tanggal pada browser. Kolom tanggal transaksi menampilkan tanggal **DD-MM-YYYY** dan waktu.

---

## 📷 Cara Pakai Scan Barcode

**Via kamera (HP/laptop):**
Klik tombol "📷 Scan" di halaman Kasir → izinkan akses kamera → arahkan ke barcode produk.

**Via alat scanner fisik (USB/Bluetooth):**
Scanner barcode fisik biasanya berfungsi seperti keyboard — tinggal sambungkan
ke laptop/HP, lalu di halaman Kasir langsung scan barang (tidak perlu klik
apapun dulu, cukup pastikan halaman Kasir sedang terbuka).

---

## 🖨 Cara Pasang Printer Thermal 58mm (TM58M)

Ada 2 metode cetak, pilih sesuai kondisi:

### Metode 1 — Print Biasa (paling mudah, work di semua device)
1. Pasang printer TM58M ke laptop/HP seperti biasa (USB atau Bluetooth), install
   driver dari paket printer jika ada, sampai printer terdaftar sebagai "printer"
   di sistem (Windows/Android/iOS)
2. Di aplikasi kasir, setelah transaksi selesai klik **"🖨 Print 58mm"**
3. Pilih printer TM58M dari dialog cetak yang muncul
4. Ukuran struk diatur 58mm. Jika printer memotong terlalu cepat/lambat, sesuaikan pilihan paper size dan margin di preferensi driver TM58M.

### Metode 2 — Bluetooth Langsung / ESC-POS (tanpa dialog print, lebih cepat)
*Hanya berjalan di Chrome (Android/Desktop), tidak didukung Safari/iPhone*
1. Buka menu **Pengaturan** di aplikasi
2. Klik **"🔗 Pasangkan Printer Bluetooth"**
3. Pilih TM58M dari daftar perangkat Bluetooth yang muncul
4. Ubah **Metode Cetak** ke "Bluetooth langsung"
5. Di halaman Kasir, klik **"🔗 Hubungkan Printer TM58M"** dan pilih printer sebelum transaksi/cetak
6. Setelah transaksi, klik **"📡 Print Bluetooth"** — struk langsung tercetak
   tanpa dialog print
7. Jika cash drawer tersambung ke port DK printer, opsi **Buka cash drawer otomatis** mengirim pulsa pembuka setelah struk. Pilih Pin 2 (umum) atau Pin 5 sesuai spesifikasi laci/printer.

---

## 👤 Login & Role

| Role | Bisa Akses |
|------|-----------|
| **Admin** | Semua halaman: Kasir, Produk, Riwayat, Laporan, Pengguna, Pengaturan |
| **Kasir** | Kasir, Riwayat, Laporan (tidak bisa ubah produk/pengguna) |

Tambah/edit pengguna lewat menu **Pengguna** (khusus admin).

---

## 📊 Laporan

Menu **Laporan** menampilkan:
- Total penjualan hari ini, minggu ini, bulan ini
- Grafik penjualan 7 hari terakhir
- Produk terlaris hari ini
- Daftar produk dengan stok menipis (≤5)

---

## 🗂️ Isi Paket

| File | Fungsi |
|------|--------|
| `Code.gs` | Backend — paste ke Google Apps Script |
| `index.html` | Aplikasi web lengkap — host atau buka langsung |
| `README.md` | Panduan ini |

---

## ❓ Troubleshooting

**"URL API belum diatur"**
→ Buka menu Pengaturan di aplikasi, masukkan URL dari Apps Script deployment

**Login gagal / "Gagal konek ke server"**
→ Pastikan deployment Apps Script diatur **"Who has access: Anyone"**, bukan "Only myself"

**Setelah edit Code.gs, perubahan tidak muncul**
→ Harus buat **New deployment** lagi (bukan edit deployment lama), atau klik
   Deploy → Manage deployments → ikon pensil → ganti versi ke "New version"

**Scan kamera tidak jalan**
→ Pastikan browser diberi izin akses kamera, dan aplikasi diakses lewat HTTPS
   (http biasa di sebagian browser akan memblokir akses kamera)

**Print Bluetooth tidak muncul perangkat**
→ Pastikan pakai Chrome (bukan Safari), printer dalam mode pairing/menyala,
   dan Bluetooth laptop/HP aktif

**Data tidak sinkron / stok aneh**
→ Cek langsung ke Google Sheets, semua data asli tersimpan di sana — aplikasi
   web hanya "jendela" untuk mengaksesnya
