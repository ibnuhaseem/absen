# Frontend - Sistem Absensi Sholat 5 Waktu Santri

Dokumentasi frontend untuk aplikasi absensi sholat berbasis QR Code dengan Next.js + Tailwind CSS.

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── layout.tsx              # Root layout dengan context providers
│   ├── globals.css             # Global styles
│   ├── page.tsx                # Home page
│   ├── scan/
│   │   └── page.tsx            # Scan page
│   ├── laporan/
│   │   └── page.tsx            # Report page
│   └── setting/
│       └── page.tsx            # Settings page
├── components/
│   ├── Navbar.tsx              # Navigation bar dengan online status
│   ├── NotificationCenter.tsx   # Toast notifications
│   ├── scan/
│   │   ├── ScanSession.tsx      # QR scanner dengan html5-qrcode
│   │   ├── ValidationModal.tsx  # Visual validation anti-joki
│   │   └── SyncModal.tsx        # Batch sync with retry logic
│   └── setting/
│       ├── StudentManagement.tsx
│       ├── CSVImport.tsx
│       ├── QRGenerator.tsx
│       ├── BackupRestore.tsx
│       └── TermsAndConditions.tsx
├── context/
│   ├── OnlineStatusContext.tsx  # Online/offline status tracking
│   └── NotificationContext.tsx  # Global notification system
└── lib/
    ├── supabase.ts             # Supabase client & interfaces
    └── indexeddb.ts            # IndexedDB utilities untuk offline-first
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ dan npm/yarn/pnpm
- Supabase project dengan database initialized (lihat PRD section 6)

### 1. Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 2. Environment Configuration

Copy `.env.local.example` ke `.env.local` dan isi kredensial Supabase:

```bash
cp .env.local.example .env.local
```

Isi dengan nilai dari Supabase project:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📱 Pages Overview

### 1. **Home (/)** - Landing Page
- Overview fitur aplikasi
- Quick links ke scan, laporan, dan setting
- Feature highlights & tech stack info

### 2. **Scan (/scan)** - QR Code Scanner
**Workflow:**
1. Pilih waktu sholat (Subuh, Dzuhur, Ashar, Maghrib, Isya)
2. Pilih tanggal
3. Klik "Buka Sesi Absen" → Scanner kamera aktif
4. Arahkan kamera ke QR code santri
5. Modal validasi visual dengan foto santri
6. Klik "Tutup Sesi" → Batch sync ke Supabase

**Features:**
- Real-time QR scanning dengan html5-qrcode
- Audio feedback (success beep / error sound)
- Duplicate scan detection
- Offline buffer dengan IndexedDB
- Sync dengan retry logic (max 5 attempts)
- Pending sync indicator

**Technical Details:**
- QR format: `[NIM]` (e.g., `202607001`)
- Storage: IndexedDB untuk pending records
- Sync: Batch insert ke `log_absensi` table
- Offline: Full functionality sampai sync

### 3. **Laporan (/laporan)** - Attendance Report
**Features:**
- Filter by period (Harian, Mingguan, Bulanan)
- Filter by class (7, 8, 9, Semua)
- Statistics cards (Total Hadir, Telat, Alpa)
- Attendance table dengan detail view
- Export to PDF/Excel/CSV

**Filtering:**
- Date range selection
- Class filter dropdown
- Real-time data updates

**Modal Details:**
- Click santri row → Detail modal
- Tampilkan: NIM, Nama, Kelas, Tanggal, Waktu Sholat, Status, Waktu Scan

### 4. **Setting (/setting)** - Configuration & Management
**Tabs:**
1. **Manajemen Santri**
   - CRUD santri (Add, Edit, Delete)
   - Upload foto ke Supabase Storage
   - Toggle active/inactive status
   - Bulk actions

2. **Import CSV**
   - Drag-drop CSV upload
   - Template download
   - Format validation (nim, nama, kelas, foto_url)
   - Duplicate detection

3. **Cetak QR Code**
   - Preview QR per santri
   - Bulk print to PDF
   - Customizable format (A4 grid, ukuran, info)
   - Download individual QR

4. **Backup & Export**
   - Manual backup trigger
   - Automatic daily backups (00:05 UTC)
   - Restore from backup (dengan warning)
   - Export attendance logs (PDF/Excel/CSV)

5. **Terms & Conditions**
   - Display terms & privacy policy
   - Admin dapat customize terms
   - Consent checkbox
   - Audit log section (future)

## 🛠️ Key Components

### Context Providers

#### OnlineStatusContext
```typescript
const { isOnline } = useOnlineStatus()
```
- Tracks online/offline status
- Updates navbar indicator
- Used for graceful degradation

#### NotificationContext
```typescript
const { showNotification } = useNotification()
// Usage:
showNotification('success', 'Data berhasil disimpan', 3000)
showNotification('error', 'Terjadi kesalahan')
showNotification('warning', 'Peringatan penting')
showNotification('info', 'Informasi tambahan', 0) // 0 = no auto-dismiss
```

### QR Scanner (html5-qrcode)
```typescript
const qrcodeRef = useRef<Html5Qrcode>(null)

useEffect(() => {
  qrcodeRef.current = new Html5Qrcode('qr-reader')
  await qrcodeRef.current.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    onScanSuccess,
    onScanError
  )
}, [])
```

### IndexedDB for Offline Support
```typescript
import { 
  saveSantri, 
  getSantri, 
  addLogAbsensi, 
  getPendingSync 
} from '@/lib/indexeddb'

// Save master data
await saveSantri(santriList)

// Add attendance log
await addLogAbsensi(logRecord)

// Get pending sync
const pending = await getPendingSync()
```

## 🔄 Offline-First Sync Flow

```
┌─────────────────────┐
│  User Scans QR      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Add to IndexedDB    │◄─── Offline Buffer
│ (PENDING)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Internet Online?    │
└──────────┬──────────┘
      Yes  │
           ▼
┌─────────────────────┐
│ Batch Sync to       │
│ Supabase            │
└──────────┬──────────┘
           │
       Success?
      ╱        ╲
    Yes         No
    │           │
    ▼           ▼
┌─────────┐  ┌──────────────┐
│ Confirm │  │ Retry Modal  │
│ Remove  │  │ (Max 5x)     │
│ from    │  │ OR Save Draft│
│ IndexDB │  └──────────────┘
└─────────┘
```

## 📊 Data Flow

### Scan Session Flow
1. Admin membuka sesi → Buffer kosong di IndexedDB
2. Scan QR → Validasi format → Modal visual
3. Confirm → Tambah ke buffer dengan status HADIR
4. Multiple scans → Live counter update
5. Tutup sesi → Hitung santri tidak scan → Mark TELAT/ALPA
6. Batch insert ke Supabase dengan retry logic

### Sync Flow
- Auto-sync: Saat online terdeteksi atau interval 5 menit
- Manual sync: Tombol di SyncModal
- Retry: Max 5x attempts dengan exponential backoff
- Draft save: Keep data offline jika sync gagal

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach dengan Tailwind CSS
- Grid layouts untuk desktop view
- Touch-friendly buttons & inputs
- Readable font sizes

### Accessibility
- Semantic HTML structure
- ARIA labels untuk interactive elements
- Keyboard navigation support
- Color contrast compliance

### Real-time Feedback
- Toast notifications untuk setiap aksi
- Loading spinners untuk async operations
- Progress bars untuk sync
- Status badges (HADIR, TELAT, ALPA)

## 🔐 Security Considerations

1. **Environment Variables**
   - NEXT_PUBLIC_* only untuk public keys
   - Service role key never exposed client-side
   - .env.local in .gitignore

2. **Data Validation**
   - Client-side validation untuk QR format
   - Duplicate detection sebelum submit
   - Server-side validation di Supabase RLS

3. **Photo Upload**
   - MIME type validation (jpeg, png, webp)
   - File size check (max 2MB)
   - Scan NIM untuk folder structure

## 🚀 Deployment (Vercel)

### Setup

1. Push code ke repository (GitHub/GitLab)
2. Import project di Vercel dashboard
3. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
4. Deploy → Otomatis saat push ke main branch

### PWA Setup
- manifest.json akan dibuat untuk PWA install
- Service worker untuk offline support
- Add to home screen functionality

## 📝 Development Guidelines

### Naming Conventions
- Components: PascalCase (e.g., `ScanSession.tsx`)
- Hooks: camelCase starting with `use` (e.g., `useOnlineStatus`)
- Constants: UPPER_SNAKE_CASE
- Variables: camelCase

### Styling
- Tailwind CSS untuk utility classes
- Custom CSS di `globals.css` untuk global styles
- Component-scoped styling dengan Tailwind classes

### Component Structure
```typescript
'use client' // Server component directive jika perlu interaktif

import { useState, useEffect } from 'react'
import { useNotification } from '@/context/NotificationContext'

export default function ComponentName() {
  const { showNotification } = useNotification()
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

## 🧪 Testing (Future)

- Unit tests dengan Jest
- E2E tests dengan Playwright
- Visual regression testing
- Performance testing

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- [IndexedDB MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 🐛 Troubleshooting

### Camera Access Issues
- Ensure camera permission granted in browser
- Check browser console for permission errors
- On mobile, use HTTPS for camera access

### Supabase Connection
- Verify NEXT_PUBLIC_SUPABASE_URL format
- Check network requests di DevTools
- Ensure RLS policies allow anonymous access

### IndexedDB Not Working
- Check browser storage quota
- Clear browser cache & restart
- Verify IndexedDB is not disabled in privacy settings

---

**Last Updated:** 2024-12-20  
**Version:** 0.1.0  
**Status:** Active Development
