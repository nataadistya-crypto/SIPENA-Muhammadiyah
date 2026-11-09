-- Skema database SIPENA Muhammadiyah (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS akun (            -- akun ustadzah
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'u' CHECK (role IN ('u','a')),
  nama TEXT NOT NULL DEFAULT 'Ustadzah',
  google_email TEXT UNIQUE,
  email TEXT UNIQUE);

CREATE TABLE IF NOT EXISTS email_login_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS kelas (
  id TEXT PRIMARY KEY CHECK (id IN ('sore','malam')),
  nama TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS murid (           -- satu murid = satu akun wali
  id TEXT PRIMARY KEY,
  ustadzah_id TEXT NOT NULL REFERENCES akun(username),
  nama TEXT NOT NULL COLLATE NOCASE,         -- nama pengguna wali murid
  no_absen INTEGER NOT NULL,
  kelas_id TEXT NOT NULL REFERENCES kelas(id),
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
  tgl_masuk TEXT,
  pass_awal TEXT,                            -- nomor absen, kosong setelah sandi diganti
  pass_hash TEXT,                            -- sandi baru (terenkripsi)
  ganti_sandi INTEGER NOT NULL DEFAULT 0,
  nomor_hp TEXT,
  UNIQUE (ustadzah_id, nama));

CREATE TABLE IF NOT EXISTS absensi (
  murid_id TEXT NOT NULL REFERENCES murid(id),
  tanggal TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Hadir','Izin','Sakit','Alpa')),
  PRIMARY KEY (murid_id, tanggal));

CREATE TABLE IF NOT EXISTS capaian (         -- riwayat capaian (sore: jilid; malam: juz)
  id TEXT PRIMARY KEY,
  murid_id TEXT NOT NULL REFERENCES murid(id),
  tanggal TEXT NOT NULL,
  kelas_id TEXT NOT NULL REFERENCES kelas(id),
  jilid_juz INTEGER NOT NULL,
  halaman INTEGER NOT NULL,
  hasil TEXT NOT NULL DEFAULT '',
  lulus INTEGER NOT NULL DEFAULT 0,
  surah TEXT NOT NULL DEFAULT '',
  bisa_baca INTEGER NOT NULL DEFAULT 0,
  bisa_tulis INTEGER NOT NULL DEFAULT 0,
  bisa_hitung INTEGER NOT NULL DEFAULT 0,
  catatan TEXT NOT NULL DEFAULT '');

CREATE TABLE IF NOT EXISTS pindah_kelas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  murid_id TEXT NOT NULL REFERENCES murid(id),
  dari TEXT NOT NULL REFERENCES kelas(id),
  ke TEXT NOT NULL REFERENCES kelas(id),
  tanggal TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS tugas (
  id TEXT PRIMARY KEY,
  ustadzah_id TEXT NOT NULL REFERENCES akun(username),
  judul TEXT NOT NULL,
  kelas_id TEXT NOT NULL REFERENCES kelas(id),
  tanggal TEXT);

CREATE TABLE IF NOT EXISTS nilai (
  murid_id TEXT NOT NULL REFERENCES murid(id),
  tugas_id TEXT NOT NULL REFERENCES tugas(id),
  nilai REAL NOT NULL,
  PRIMARY KEY (murid_id, tugas_id));

CREATE TABLE IF NOT EXISTS materi (
  id TEXT PRIMARY KEY,
  ustadzah_id TEXT NOT NULL REFERENCES akun(username),
  judul TEXT NOT NULL,
  mapel TEXT NOT NULL,
  kelas_id TEXT NOT NULL REFERENCES kelas(id),
  isi TEXT NOT NULL,
  file_name TEXT,
  file_path TEXT);

CREATE TABLE IF NOT EXISTS soal_kuis (
  id TEXT PRIMARY KEY,
  ustadzah_id TEXT NOT NULL REFERENCES akun(username),
  pertanyaan TEXT NOT NULL,
  opsi1 TEXT NOT NULL, opsi2 TEXT NOT NULL, opsi3 TEXT NOT NULL, opsi4 TEXT NOT NULL,
  jawaban INTEGER NOT NULL CHECK (jawaban BETWEEN 0 AND 3));

CREATE TABLE IF NOT EXISTS pengaturan (
  kunci TEXT PRIMARY KEY,
  nilai TEXT NOT NULL);

INSERT OR IGNORE INTO pengaturan VALUES
  ('warna_utama','#8ecae6'),
  ('warna_kedua','#4076d1');

INSERT OR IGNORE INTO kelas VALUES ('sore','Kelas Sore'), ('malam','Kelas Malam');