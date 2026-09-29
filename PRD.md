# Product Requirements Document (PRD)
## Sistem Absensi Sholat 5 Waktu Santri

---

### 1. Ringkasan Produk
Aplikasi web (PWA / Mobile-first) absensi sholat 5 waktu santri berbasis QR Code dengan kapabilitas offline-first, sinkronisasi data instan, validasi visual anti-joki, serta manajemen santri terpusat.

**Teknologi Utama:**
* **Frontend & UI:** Next.js (App Router) + Tailwind CSS (dukungan PWA / Offline Service Worker).
* **Database & Backend:** Supabase (PostgreSQL, Row Level Security, Realtime / REST API).
* **Penyimpanan File (Storage):** Supabase Storage (Bucket foto santri).
* **Hosting & Deployment:** Vercel (Edge Network & Serverless Functions).

---

### 2. Tech Stack & Arsitektur Sistem

#### 2.1 Komponen Arsitektur
1. **Frontend (Next.js App Router + Tailwind CSS):**
   * UI responsif mobile-first dengan Tailwind CSS.
   * Client-side QR Scanner (`html5-qrcode` / `BarcodeDetector API`) & audio feedback.
   * Offline Cache & Buffer Sesi menggunakan IndexedDB / LocalStorage.
2. **Backend & Database (Supabase PostgreSQL):**
   * Relational database dengan foreign keys, indexing, dan trigger `updated_at`.
   * Row Level Security (RLS) untuk perlindungan akses data.
   * Supabase JS Client (`@supabase/supabase-js`) untuk operasi CRUD & batch insert langsung/via API route.
3. **Penyimpanan File (Supabase Storage):**
   * Bucket publik/terproteksi: `foto-santri`.
   * CDN terintegrasi untuk loading foto instan pada modal validasi scan.
4. **Hosting & CI/CD (Vercel):**
   * Serverless deployment global dengan auto-build dari repository Git.
   * Environment variable management aman (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

#### 2.2 Mekanisme Sync (Offline-First / Incremental Sync)
* **Cold Start (Akses Pertama):** Unduh master santri aktif ke IndexedDB lokal. Catat `last_sync_timestamp`.
* **Delta Sync:** Query Supabase: `.from('santri').select('*').gt('updated_at', last_sync)`. Mengurangi konsumsi bandwidth.
* **Auto-Sync:** Background sync saat window focus atau berkala (interval 5 menit) saat koneksi online terdeteksi.

#### 2.3 Arsitektur Batch Scan Sesi Sholat
1. Admin memilih Waktu Sholat (Subuh, Dzuhur, Ashar, Maghrib, Isya) & Tanggal.
2. Klik **"Buka Sesi Absen"**:
   * Scanner aktif, setiap scan valid masuk antrean lokal IndexedDB.
   * Popup visual anti-joki menampilkan foto dari Supabase Storage / CDN.
3. Klik **"Tutup Sesi Absen"**:
   * Menghitung santri yang hadir vs santri terdaftar -> santri tidak hadir otomatis ditandai `TELAT` / `ALPA`.
   * Batch insert record sesi ke tabel `log_absensi` Supabase dalam 1 request transaksi (`supabase.from('log_absensi').insert(batchPayload)`).

---

### 3. Struktur Navigasi & Modul Fitur

```
[ Layout App Router ]
├── /laporan  -> Rekap Kehadiran, Filter Kelas (7/8/9), Ringkasan Sholat, Modal Detail Log Santri
├── /scan     -> Sesi Sholat, Scanner QR Kamera, Visual Anti-Joki, Buffer Batch, Tutup Sesi
└── /setting  -> CRUD Santri, Upload Foto ke Supabase Storage, Import CSV, Cetak QR Massal
```

#### 3.1 Menu: Laporan (`/laporan`)
* **Filter:** Periode (Harian, Mingguan, Bulanan), Filter Kelas (7, 8, 9, Semua).
* **Statistik Card:** Total Hadir, Total Telat, Total Alpa per waktu sholat.
* **Tabel Santri Telat / Rekap:**
  * Kolom: NIM, Nama Santri, Kelas, Total Telat.
  * Interaksi: Klik santri membuka **Modal Detail Log** (Tanggal, Hari, Waktu Sholat, Status, Waktu Scan).

#### 3.2 Menu: Scan (`/scan`)
* **Workflow:**
  1. Pilih waktu sholat & buka sesi.
  2. Kamera live scanner (dukungan switch kamera depan/belakang, flash).
  3. **Modal Validasi Visual (Anti-Joki):**
     * Foto santri (dari Supabase Storage), Nama, NIM, Kelas, Jam Scan.
     * Suara bip berhasil / nada error jika QR ganda / tidak valid.
  4. Live Counter santri ter-scan.
  5. Tutup sesi & sinkronisasi batch ke Supabase.

#### 3.3 Menu: Setting (`/setting`)
* **CRUD Santri:**
  * Form input: NIM, Nama Lengkap, Kelas (7/8/9), Foto Santri.
  * Upload foto langsung ke Supabase Storage (`foto-santri/[nim]-[timestamp].[ext]`), URL disimpan di kolom `foto_url`.
  * Edit & nonaktifkan / hapus santri.
* **Bulk Import CSV:**
  * Upload CSV (kolom: `nim,nama,kelas,foto_url`).
  * Validasi duplikasi NIM & format baris sebelum upsert massal ke Supabase.
  * Download Template CSV bawaan.
* **Bulk QR Generator & Print:**
  * Cetak kartu santri massal (Grid cetak A4 berisi Foto, NIM, Nama, Kelas, dan QR Code).

---

### 4. Spesifikasi Database (Supabase PostgreSQL & Storage)

#### 4.1 Tabel: `santri` (Master Data Santri)
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `nim` | VARCHAR(50) | Primary Key (Nomor Induk Santri) |
| `nama` | VARCHAR(255) | Nama Lengkap Santri |
| `kelas` | VARCHAR(20) | Kelas (7 / 8 / 9) |
| `foto_url` | TEXT | URL publik file di Supabase Storage |
| `is_active` | BOOLEAN | Status aktif (Default: `true`) |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan record |
| `updated_at` | TIMESTAMPTZ | Waktu perubahan terakhir (Auto via Trigger) |

#### 4.2 Tabel: `log_absensi` (Riwayat Presensi)
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key (Default: `gen_random_uuid()`) |
| `tanggal` | DATE | Tanggal Masehi (YYYY-MM-DD) |
| `waktu_sholat` | VARCHAR(20) | Subuh / Dzuhur / Ashar / Maghrib / Isya |
| `nim` | VARCHAR(50) | Foreign Key -> `santri.nim` |
| `nama` | VARCHAR(255) | Snapshot nama santri saat sesi absen |
| `kelas` | VARCHAR(20) | Snapshot kelas santri saat sesi absen |
| `status` | VARCHAR(20) | `HADIR` / `TELAT` / `ALPA` |
| `waktu_scan` | VARCHAR(50) | Jam/waktu santri scan (kosong jika telat/alpa) |
| `sync_at` | TIMESTAMPTZ | Waktu record masuk ke Supabase |

#### 4.3 Supabase Storage Bucket
* **Bucket ID:** `foto-santri`
* **Public Access:** Enabled (untuk rendering foto instan di web/scanner)
* **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`
* **Max File Size:** 2 MB per file

---

### 5. Template File CSV (Import Data Santri)

Format file `template_santri.csv`:
```csv
nim,nama,kelas,foto_url
202607001,Ahmad Fauzan,7,https://your-supabase-project.supabase.co/storage/v1/object/public/foto-santri/202607001.jpg
202607002,Muhammad Rizky,7,https://your-supabase-project.supabase.co/storage/v1/object/public/foto-santri/202607002.jpg
202608001,Fathur Rahman,8,
202609001,Zaid Abdullah,9,
```

---

### 6. Skrip Inisialisasi Database (Supabase SQL Migration)

```sql
-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Table: santri
CREATE TABLE IF NOT EXISTS public.santri (
  nim VARCHAR(50) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kelas VARCHAR(20) NOT NULL,
  foto_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table: log_absensi
CREATE TABLE IF NOT EXISTS public.log_absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  waktu_sholat VARCHAR(20) NOT NULL CHECK (waktu_sholat IN ('Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya')),
  nim VARCHAR(50) NOT NULL REFERENCES public.santri(nim) ON UPDATE CASCADE ON DELETE RESTRICT,
  nama VARCHAR(255) NOT NULL,
  kelas VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('HADIR', 'TELAT', 'ALPA')),
  waktu_scan VARCHAR(50) DEFAULT '',
  sync_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_santri_updated_at ON public.santri (updated_at);
CREATE INDEX IF NOT EXISTS idx_santri_kelas_active ON public.santri (kelas, is_active);
CREATE INDEX IF NOT EXISTS idx_log_absensi_tanggal ON public.log_absensi (tanggal);
CREATE INDEX IF NOT EXISTS idx_log_absensi_nim ON public.log_absensi (nim);
CREATE INDEX IF NOT EXISTS idx_log_absensi_session ON public.log_absensi (tanggal, waktu_sholat);
CREATE INDEX IF NOT EXISTS idx_log_absensi_status ON public.log_absensi (status);

-- 5. Auto-update Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_santri_updated_at ON public.santri;
CREATE TRIGGER trg_santri_updated_at
BEFORE UPDATE ON public.santri
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6. Row Level Security (RLS)
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_absensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read santri" ON public.santri FOR SELECT USING (true);
CREATE POLICY "Allow insert/update santri" ON public.santri FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read log_absensi" ON public.log_absensi FOR SELECT USING (true);
CREATE POLICY "Allow insert log_absensi" ON public.log_absensi FOR INSERT WITH CHECK (true);

-- 7. Supabase Storage Setup (foto-santri bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('foto-santri', 'foto-santri', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public storage view"
ON storage.objects FOR SELECT
USING (bucket_id = 'foto-santri');

CREATE POLICY "Allow authenticated/anon storage upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foto-santri');
```

---

### 7. Strategi Performa, Keamanan & Deployment (Vercel + Supabase)
* **Vercel Edge Network:** Static asset Next.js dan cached route terdistribusi via global CDN untuk latency rendah.
* **Supabase Connection Pooling & Indexing:** Optimasi query tanggal dan sesi sholat menggunakan B-Tree index pada PostgreSQL.
* **Single Batch Insert:** Payload sesi sholat dikirim dalam 1 call `insert([...])` tanpa N+1 network overhead.
* **Storage Optimization:** Gambar foto santri dioptimasi/di-resize sebelum upload, disajikan lewat Supabase Storage CDN.
* **Offline Resilience:** IndexedDB menyimpan data santri & buffer sesi lokal saat internet terputus di area masjid/pesantren.

---

### 8. Error Handling & Data Validation

#### 8.1 QR Code Validation
* **Format Validation:** QR code harus mengandung NIM santri dalam format `[NIM]` (e.g., `202607001`).
* **Invalid QR Handling:**
  * Jika QR tidak sesuai format → Tampilkan error toast: "QR Code tidak valid".
  * Suara notifikasi error (nada error 400ms).
  * Log invalid scan ke IndexedDB untuk audit trail.
* **QR Expiry:** Setiap QR code tidak memiliki masa berlaku, tetapi validasi terhadap daftar santri aktif (`is_active = true`).

#### 8.2 Duplicate Scan Detection
* **Same Session:** Jika santri yang sama di-scan 2x dalam sesi yang sama → Tampilkan peringatan modal:
  - "Santri [Nama] sudah scan. Lanjutkan?" (Update waktu scan ke scan terakhir atau abaikan).
  - Opsi: "Update" (ganti waktu scan) atau "Batal".
* **Logging:** Setiap duplicate scan attempt dicatat dengan timestamp untuk audit.

#### 8.3 Network Error Handling & Retry Strategy
* **Connection Detection:**
  * App mendeteksi online/offline status via `navigator.onLine` & Supabase connection check.
  * UI menampilkan indikator status (badge hijau "Online" / merah "Offline") di top-right navbar.
* **Failed Sync Handling:**
  * Jika batch insert gagal (timeout/error 500): Tampilkan modal retry dengan 3 opsi:
    - "Retry Sekarang" (immediate retry).
    - "Retry Otomatis" (background retry setiap 30 detik).
    - "Simpan Draft" (tetap offline, manual sync nanti).
  * Max retry attempts: 5x sebelum notifikasi manual intervention diperlukan.
* **Offline Queue Management:**
  * Jika sync gagal, batch tetap di IndexedDB dengan flag `sync_status = 'PENDING'`.
  * Background service worker akan retry setiap 5 menit saat online terdeteksi.
  * UI menampilkan badge counter "X records pending sync" di `/scan` page.

#### 8.4 Data Conflict Resolution
* **Scenario:** Admin A mengedit santri offline, Admin B mengedit santri yang sama online.
* **Resolution Strategy (Last-Write-Wins):**
  * Server `updated_at` timestamp vs local `updated_at` timestamp.
  * Jika server timestamp lebih baru → Server version digunakan.
  * Jika local timestamp lebih baru → Local version diupload dengan warning notification.
  * Conflict log dicatat ke IndexedDB dengan detail: `{field, old_value, new_value, resolved_at}`.

---

### 9. Backup & Data Recovery

#### 9.1 Export & Backup Functionality
* **Location:** Sub-menu di `/setting` → "Backup & Export".
* **Export Options:**
  1. **Export Attendance Log (PDF):**
     - Date range filter (dari - hingga).
     - Filter by kelas (7/8/9 atau semua).
     - Format: Tabel dengan kolom: Tanggal, Waktu Sholat, NIM, Nama, Kelas, Status, Waktu Scan.
     - Filename: `laporan-absensi-[tanggal_dari]-[tanggal_hingga].pdf`.
  2. **Export Attendance Log (Excel/CSV):**
     - Sama dengan PDF, tapi format tabular CSV.
     - Include summary statistik per sheet (Total Hadir, Telat, Alpa).
     - Filename: `laporan-absensi-[tanggal].xlsx`.
  3. **Export Master Santri (CSV):**
     - Kolom: NIM, Nama, Kelas, Foto URL, is_active, created_at.
     - Filename: `master-santri-[tanggal].csv`.

#### 9.2 Automatic Backup
* **Daily Backup:** Setiap hari jam 00:05 UTC, sistem melakukan backup otomatis snapshot `santri` dan `log_absensi` ke Supabase bucket `backups/`.
* **Backup Retention:** Keep 30 hari terakhir (old backups auto-deleted).
* **Manual Backup:** Admin bisa trigger backup manual via button di `/setting` → "Backup Sekarang".

#### 9.3 Data Retention Policy
* **Attendance Logs (`log_absensi`):**
  - Retain selama **1 tahun akademik** (misal: Juli Tahun N - Juni Tahun N+1).
  - Logs lebih tua dari 1 tahun akan di-archive ke storage & tidak query aktif.
* **Student Master (`santri`):**
  - Retain indefinitely (historical data penting).
  - Soft delete: Set `is_active = false` untuk non-destructive removal.
* **Storage/Photos:**
  - Retain selama santri aktif.
  - Hapus foto setelah santri di-delete (soft delete: set `foto_url = NULL`).

#### 9.4 Data Recovery Procedures
* **Accidental Session Delete:**
  - Tombol "Undo" muncul 30 detik setelah session di-close.
  - Atau: Admin dapat restore dari backup (harus contact administrator untuk restore dari daily backup).
* **Restore from Backup:**
  - Menu: `/setting` → "Restore from Backup".
  - List backup files (daily snapshots).
  - Pilih backup date → Confirm restore (warning: akan overwrite data aktif).
  - Restore process berjalan background, notifikasi setelah selesai.
* **Corrupted Data Recovery:**
  - Jika data corrupted terdeteksi (foreign key violation, inconsistent status), alert admin.
  - Provide "Auto-repair" tool yang melakukan data validation & cleanup.

---

### 10. Notifications & Alerts

#### 10.1 Sync Notifications
* **Sync Success:**
  - Toast notifikasi hijau: "✓ Data sinkronisasi berhasil (32 records)".
  - Duration: 3 detik auto-dismiss.
* **Sync Failed:**
  - Toast notifikasi merah: "✗ Sinkronisasi gagal. [Retry] [Dismiss]".
  - Retry button untuk manual retry.
* **Sync In Progress:**
  - Banner notification: "⟳ Sinkronisasi data... (12/45 records)".
  - Progress bar di banner.

#### 10.2 Session & Attendance Alerts
* **Session Close Alerts:**
  - Modal warning saat admin klik "Tutup Sesi":
    - "Sesi Dzuhur akan ditutup. Santri tidak ter-scan: [X orang]. Lanjutkan?"
    - Include list santri yang tidak hadir (TELAT/ALPA).
  - Opsi: "Ya, Tutup" atau "Batal".
* **Optional: ALPA Alert (Configurable):**
  - Admin bisa enable/disable di `/setting` → "Notification Settings".
  - Jika enabled: Setiap santri marked ALPA, trigger SMS/Email ke wali santri (future integration).
  - Local notification: Toast "📢 [Nama] ditandai ALPA - [Waktu Sholat]".

#### 10.3 Prayer Time Reminders (Optional)
* **Location:** `/setting` → "Prayer Time Reminders".
* **Feature:** Admin dapat set reminder notifikasi sebelum session dimulai:
  - 5 menit sebelum waktu sholat → Browser notification: "Persiapan Sholat Dzuhur dalam 5 menit".
  - 1 menit sebelum → "Buka Sesi Dzuhur sekarang".
* **Notification Type:** 
  - Browser push notification (jika PWA installed).
  - Fallback: Toast notification di dalam app.

#### 10.4 Error & Validation Alerts
* **Invalid QR Scan:** Toast red "❌ QR Code tidak valid atau santri tidak terdaftar".
* **Duplicate Scan:** Modal dialog: "⚠️ [Nama] sudah ter-scan. Update waktu atau abaikan?"
* **Upload Failed:** Toast "❌ Upload foto gagal. Ukuran maksimal 2MB".

---

### 11. Disaster Recovery & Downtime Strategy

#### 11.1 Supabase Outage Handling
* **Status Detection:**
  - App melakukan health check ke Supabase setiap 30 detik (ping endpoint).
  - Jika 3 request berturut-turut gagal → Assume Supabase down.
* **Graceful Degradation:**
  - **Scan Session:** Tetap berjalan offline (buffer lokal di IndexedDB).
  - **Laporan:** Tampilkan cached data + warning banner: "⚠️ Data kemarin terakhir disinkronisasi. Data real-time tidak tersedia".
  - **Setting:** Batasi fitur yang butuh network (upload foto), tampilkan: "Fitur ini memerlukan koneksi internet".
* **User Notification:**
  - Banner notification (non-intrusive): "Koneksi server terputus. App berjalan offline.".
  - Indikator status di navbar: Badge merah "Offline".
* **Recovery:**
  - Saat Supabase online kembali, auto-trigger sync dengan batch queue.
  - Notification: "✓ Server online kembali. Sinkronisasi data...".

#### 11.2 Service Worker Cache Strategy
* **Cache Duration:**
  - **Student Master (`santri`):** Cache validity 24 jam. Jika lebih lama, gunakan cached data dengan warning.
  - **Attendance Logs:** Cache 7 hari terakhir untuk laporan offline access.
  - **Static Assets (JS/CSS/images):** Cache indefinitely (bust cache on deploy via version hash).
* **Cache Invalidation:**
  - Manual: Admin bisa trigger "Clear Cache & Reload" di `/setting` → "Advanced".
  - Automatic: Service worker cache invalidated saat deploy baru (via Vercel).

#### 11.3 Maximum Acceptable Offline Period
* **Scan Session:** Max **8 jam offline** (full school day). Buffer dapat store ~500 scans di IndexedDB.
* **Data Freshness:** Jika offline > 24 jam:
  - Warning: "Data mungkin sudah kadaluarsa. Sinkronisasi ketika online?".
  - Disable certain features (e.g., edit santri data) sampai sync berhasil.
* **Storage Limit:** IndexedDB max size ~50MB (Browser dependent). Implement size check & warning.

#### 11.4 Emergency Procedures
* **Data Loss Prevention:**
  - Export backup manual sebelum melakukan operasi berisiko.
  - "Safe Mode": Admin bisa close session dengan "Save as Draft" → review & confirm sync later.
* **Manual Data Entry Fallback:**
  - Provide printable form template di `/setting` → "Emergency Paper Form".
  - Form: Kolom Tanggal, Waktu Sholat, Daftar Santri (checkbox hadir).
  - Data dari form bisa di-import kembali setelah sistem normal.

---

### 12. Compliance & Regulations

#### 12.1 Data Privacy & GDPR Considerations
* **Photo Storage & Usage:**
  - Explicit consent requirement: Saat upload foto santri, system menampilkan consent checkbox:
    - "☑ Saya setuju foto ini disimpan & digunakan untuk validasi presensi sesuai kebijakan sekolah".
  - Consent record disimpan di database dengan `consent_photo_at` timestamp.
* **Data Retention & Right to Be Forgotten:**
  - Santri atau wali santri dapat request penghapusan data (GDPR right to erasure).
  - Admin menu: `/setting` → "Data Deletion Requests" (untuk handle manual requests).
  - Soft delete: Set santri `is_active = false` & foto `foto_url = NULL` (preserve attendance history untuk audit).
* **Data Minimization:**
  - Hanya kumpulkan data yang diperlukan (NIM, Nama, Kelas, Foto).
  - Tidak collect: Device ID, IP address, atau tracking data.
* **Encryption in Transit:**
  - Semua communication ke Supabase via HTTPS (TLS 1.3+).
  - Environment variables sensitif (Supabase keys) jangan pernah log/expose.

#### 12.2 Device Permissions
* **Camera Permission:**
  - First load di `/scan`: Browser request camera permission.
  - User dapat grant/deny. Jika denied → Tampilkan error "Akses kamera diperlukan untuk scan QR".
  - Permission state disimpan browser (tidak perlu ulang setiap scan).
* **Storage Permission (Mobile PWA):**
  - PWA meminta permission untuk cache offline (Storage API).
  - Message: "App memerlukan penyimpanan lokal untuk mode offline. Izinkan?".
* **Notification Permission (Optional):**
  - Untuk push notifications, request permission saat first open `/scan` atau `/setting`.

#### 12.3 Photo Storage & Usage Terms
* **Terms Visibility:**
  - Di `/setting` → "Terms & Conditions" section tunjukkan:
    1. **Photo Storage Terms:**
       - Foto disimpan secara aman di Supabase Storage (encrypted at rest).
       - Photo diakses hanya oleh admin & scanner app untuk validasi presensi.
       - Photo tidak akan dishare ke pihak ketiga tanpa persetujuan eksplisit.
    2. **Data Usage:**
       - Attendance logs digunakan untuk pelaporan kehadiran & evaluasi.
       - Data tidak akan dijual atau digunakan untuk marketing/tracking tanpa consent.
    3. **Data Retention:**
       - Logs dipertahankan selama 1 tahun akademik.
       - Foto dihapus ketika santri dikeluarkan atau request penghapusan data.
* **Audit Log:**
  - Setiap akses foto/data dicatat (future: implement detailed audit table).
  - Admin dapat view audit log: `/setting` → "Audit Log" (who accessed what, when).

#### 12.4 Age of Consent & Student Photo Rights
* **Consent for Minors:**
  - Karena santri mungkin di bawah 18 tahun, consent harus dari wali santri/sekolah.
  - System tidak bisa request consent langsung dari santri (todo: implement parent consent flow untuk future version).
* **School Policy Integration:**
  - Admin dapat customize Terms & Conditions sesuai kebijakan sekolah lokal.
  - Edit field di `/setting` → "School Information" → "Custom Terms".
