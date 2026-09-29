-- ============================================================
-- SISTEM ABSENSI SHOLAT 5 WAKTU SANTRI
-- Supabase SQL Migration — paste seluruh isi file ini ke
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================


-- ------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ------------------------------------------------------------
-- 1. TABLE: santri (Master Data Santri)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.santri (
  nim         VARCHAR(50)   PRIMARY KEY,
  nama        VARCHAR(255)  NOT NULL,
  kelas       VARCHAR(20)   NOT NULL CHECK (kelas IN ('7', '8', '9')),
  foto_url    TEXT,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  public.santri              IS 'Master data santri pesantren';
COMMENT ON COLUMN public.santri.nim          IS 'Nomor Induk Santri — primary key';
COMMENT ON COLUMN public.santri.foto_url     IS 'URL publik foto di Supabase Storage bucket foto-santri';
COMMENT ON COLUMN public.santri.is_active    IS 'Soft-delete flag; false = santri sudah keluar';


-- ------------------------------------------------------------
-- 2. TABLE: log_absensi (Riwayat Presensi)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.log_absensi (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal       DATE          NOT NULL,
  waktu_sholat  VARCHAR(20)   NOT NULL CHECK (waktu_sholat IN ('Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya')),
  nim           VARCHAR(50)   NOT NULL REFERENCES public.santri (nim)
                                ON UPDATE CASCADE
                                ON DELETE RESTRICT,
  nama          VARCHAR(255)  NOT NULL,
  kelas         VARCHAR(20)   NOT NULL,
  status        VARCHAR(20)   NOT NULL CHECK (status IN ('HADIR', 'TELAT', 'ALPA')),
  waktu_scan    VARCHAR(50)   NOT NULL DEFAULT '',
  sync_at       TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  public.log_absensi              IS 'Riwayat absensi per sesi sholat';
COMMENT ON COLUMN public.log_absensi.nama         IS 'Snapshot nama santri saat sesi — tidak berubah meski santri diedit';
COMMENT ON COLUMN public.log_absensi.kelas        IS 'Snapshot kelas santri saat sesi';
COMMENT ON COLUMN public.log_absensi.waktu_scan   IS 'Jam scan HH:MM:SS; kosong jika status ALPA';
COMMENT ON COLUMN public.log_absensi.sync_at      IS 'Waktu record masuk ke Supabase (dari offline buffer)';


-- ------------------------------------------------------------
-- 3. INDEXES (query performance)
-- ------------------------------------------------------------
-- Santri
CREATE INDEX IF NOT EXISTS idx_santri_updated_at    ON public.santri (updated_at);
CREATE INDEX IF NOT EXISTS idx_santri_kelas_active  ON public.santri (kelas, is_active);

-- Log absensi
CREATE INDEX IF NOT EXISTS idx_log_tanggal          ON public.log_absensi (tanggal);
CREATE INDEX IF NOT EXISTS idx_log_nim              ON public.log_absensi (nim);
CREATE INDEX IF NOT EXISTS idx_log_session          ON public.log_absensi (tanggal, waktu_sholat);
CREATE INDEX IF NOT EXISTS idx_log_status           ON public.log_absensi (status);
CREATE INDEX IF NOT EXISTS idx_log_kelas            ON public.log_absensi (kelas);


-- ------------------------------------------------------------
-- 4. AUTO-UPDATE TRIGGER: santri.updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_santri_updated_at ON public.santri;
CREATE TRIGGER trg_santri_updated_at
  BEFORE UPDATE ON public.santri
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_updated_at();


-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- Menggunakan anon key — cocok untuk deployment tanpa auth.
-- Ganti policy ini jika nanti menambahkan Supabase Auth.
-- ------------------------------------------------------------
ALTER TABLE public.santri      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_absensi ENABLE ROW LEVEL SECURITY;

-- Santri policies
CREATE POLICY "santri: anon read"
  ON public.santri FOR SELECT
  USING (true);

CREATE POLICY "santri: anon write"
  ON public.santri FOR ALL
  USING (true)
  WITH CHECK (true);

-- Log absensi policies
CREATE POLICY "log_absensi: anon read"
  ON public.log_absensi FOR SELECT
  USING (true);

CREATE POLICY "log_absensi: anon insert"
  ON public.log_absensi FOR INSERT
  WITH CHECK (true);


-- ------------------------------------------------------------
-- 6. STORAGE BUCKET: foto-santri
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'foto-santri',
  'foto-santri',
  true,
  2097152,             -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = true,
      file_size_limit    = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies
DO $$
BEGIN
  -- Allow public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'foto-santri: public read'
  ) THEN
    CREATE POLICY "foto-santri: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'foto-santri');
  END IF;

  -- Allow anon upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'foto-santri: anon upload'
  ) THEN
    CREATE POLICY "foto-santri: anon upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'foto-santri');
  END IF;

  -- Allow anon update (upsert / replace foto)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'foto-santri: anon update'
  ) THEN
    CREATE POLICY "foto-santri: anon update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'foto-santri');
  END IF;

  -- Allow anon delete (hapus foto saat santri dihapus)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'foto-santri: anon delete'
  ) THEN
    CREATE POLICY "foto-santri: anon delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'foto-santri');
  END IF;
END;
$$;


-- ------------------------------------------------------------
-- 7. SAMPLE DATA (opsional — hapus section ini di production)
-- ------------------------------------------------------------
INSERT INTO public.santri (nim, nama, kelas, is_active)
VALUES
  ('202607001', 'Ahmad Fauzan',    '7', true),
  ('202607002', 'Muhammad Rizky',  '7', true),
  ('202608001', 'Fathur Rahman',   '8', true),
  ('202608002', 'Bilal Hasan',     '8', true),
  ('202609001', 'Zaid Abdullah',   '9', true),
  ('202609002', 'Umar Faruq',      '9', true)
ON CONFLICT (nim) DO NOTHING;


-- ------------------------------------------------------------
-- 8. VERIFY — jalankan query ini setelah migration
--    untuk memastikan semua tabel & bucket terbuat
-- ------------------------------------------------------------
/*
SELECT table_name
FROM   information_schema.tables
WHERE  table_schema = 'public'
  AND  table_name IN ('santri', 'log_absensi');

SELECT id, name, public
FROM   storage.buckets
WHERE  id = 'foto-santri';

SELECT policyname, cmd
FROM   pg_policies
WHERE  tablename IN ('santri', 'log_absensi');
*/
