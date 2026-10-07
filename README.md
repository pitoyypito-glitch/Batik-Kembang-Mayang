# Website Company Profile — Batik Kembang Mayang

Website edukasi &amp; company profile untuk **Kampung Batik Kembang Mayang**
(Larangan Selatan, Tangerang), dibangun dengan **Python (Flask)**.
Sudah pakai logo resmi kampung dan mendukung **dua bahasa (Indonesia/Inggris)**
yang bisa diganti langsung dari tombol **ID / EN** di kanan atas.

Halaman yang tersedia:
- **Home** (`/`)
- **About** (`/about`)
- **Collection** (`/collection`) — koleksi motif, produk, dan testimoni
- **Our Craft** (`/our-craft`) — proses & layanan membatik
- **Paket & Harga** (`/paket`) — daftar paket workshop, harga, dan tombol booking
- **Contact** (`/contact`)

## Mengatur teks dua bahasa

Semua teks situs (judul, deskripsi, label tombol, dll.) disimpan di satu
file: **`translations.py`**. Setiap teks punya versi `"id"` (Indonesia) dan
`"en"` (Inggris) dengan key yang sama, misalnya:

```python
"hero": {
    "title": "Belajar membatik, langsung dari tangan pengrajinnya.",   # id
    "title": "Learn batik-making, straight from the artisans' hands.", # en
}
```

Untuk mengganti teks, tinggal edit isinya di `translations.py` — tidak perlu
menyentuh file HTML sama sekali. Kalau sebuah teks belum diterjemahkan ke
Inggris, situs otomatis menampilkan versi Indonesia sebagai fallback.

## Cara menjalankan di komputer sendiri

1. Pastikan Python 3.9+ sudah terpasang.
2. Buka folder ini di terminal, lalu buat virtual environment (opsional tapi disarankan):
   ```bash
   python -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```
3. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan servernya:
   ```bash
   python app.py
   ```
5. Buka `http://127.0.0.1:5000` di browser.

## Mengatur paket & harga

- Harga dan ukuran kain ada di `PACKAGE_GROUPS` di `app.py`.
- Nama, deskripsi, dan daftar fasilitas tiap paket ada di `translations.py`, bagian `packages` (versi ID dan EN).
- Brosur PDF ada di `static/files/brosur-kembang-mayang.pdf`. Ganti file ini kalau brosurnya diperbarui.

## Yang masih perlu kamu lengkapi

- **Foto asli**: aset hero dan foto kampung/produk berada di `static/img/`. Hero beranda saat ini menggunakan `hero-aranyaloka.jpeg`.
- **Testimoni**: halaman "Collection" masih memakai testimoni contoh — ganti dengan testimoni asli pengunjung/peserta kursus.
- **Booking**: formulir kontak sudah dihapus. Semua tombol booking membuka WhatsApp dengan pesan yang sudah terisi. Nomor diatur di `app.py` (`WHATSAPP_NUMBER`).
- **Statistik & nomor kontak**: angka pengikut Instagram bersifat perkiraan, dan nomor telepon/kontak person belum dicantumkan — isi dengan data resmi terbaru dari pengelola.
- **`SECRET_KEY`**: jangan diedit di `app.py`; set sebagai environment variable di server.

## Keamanan & Deploy

**Wajib sebelum online**

1. Buat secret key dan set sebagai environment variable (jangan ditulis di kode):
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   export SECRET_KEY="hasil-di-atas"
   ```
   Tanpa `SECRET_KEY`, aplikasi sengaja menolak berjalan.
2. Jalankan dengan gunicorn, jangan `python app.py`:
   ```bash
   gunicorn -w 2 -b 127.0.0.1:8000 app:app
   ```
3. Pasang HTTPS (Nginx/Caddy/Cloudflare). Jika reverse proxy meneruskan header `X-Forwarded-*`, set `TRUST_PROXY=1` dan pastikan Gunicorn hanya dapat diakses dari proxy.
4. Set `TRUSTED_HOSTS` ke domain produksi, misalnya `example.com,www.example.com`.
5. Jangan set `FLASK_DEBUG=1` di server. Mode itu hanya untuk uji lokal.

**Uji lokal:** `FLASK_DEBUG=1 python app.py`

**Sudah diterapkan di kode:** handler 404/500 tanpa traceback ke pengunjung, dukungan reverse proxy yang opt-in, pembatasan Host header melalui `TRUSTED_HOSTS`, header keamanan (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS lewat HTTPS), cookie `HttpOnly`/`Secure`/`SameSite=Lax`, pencegahan open redirect pada pergantian bahasa, batas ukuran request.

**Kalau menambah sumber eksternal baru** (skrip, font, embed), tambahkan domainnya ke `CSP` di `app.py`, kalau tidak browser akan memblokirnya.

## Deploy ke layanan hosting

Aplikasi ini adalah aplikasi Flask standar, sehingga bisa di-deploy ke layanan
seperti Render, Railway, PythonAnywhere, atau VPS biasa (start command:
`gunicorn app:app`, dan set `SECRET_KEY` di pengaturan environment layanan itu).
