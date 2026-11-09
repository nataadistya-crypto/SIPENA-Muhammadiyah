"""Isi materi pembelajaran sesuai Modul 1-4 + Materi Tambahan (dari screenshot).

Cara pakai:
  1. Taruh file ini sejajar dengan app.py.
  2. Jalankan:  python isi_modul.py
     -> tabel materi di tpq.db diganti dengan modul di bawah.
  3. Agar tombol "Kembalikan data contoh" tidak mengembalikan materi lama,
     panggil pasang(c) di akhir fungsi isi() pada seed.py.
"""
import os, sqlite3

MAPEL = ["Bahasa Arab", "Bahasa Indonesia", "Al-Qur’an & Pendidikan Agama", "Mewarnai", "Materi Tambahan"]

MODUL = [
    ("Modul 1 — Bahasa Arab: Kosakata", "Bahasa Arab",
     "Kosakata:\n"
     "آللّٰهُ — Allah\n"
     "كِتَابٌ — Buku\n"
     "قَلَمٌ — Pena\n"
     "مَسْجِدٌ — Masjid\n"
     "أُمٌّ — Ibu\n"
     "أَبٌ — Ayah\n"
     "زَهْرَةٌ — Bunga\n"
     "مَدْرَسَةٌ — Sekolah\n\n"
     "Sumber belajar tambahan:\n"
     "• Tonton Video: Belajar Kosakata Arab di YouTube\n"
     "• Baca: Pengenalan Bahasa Arab\n"
     "• Lihat Gambar: Kosakata Arab"),

    ("Modul 2 — Bahasa Indonesia: Soal Penalaran", "Bahasa Indonesia",
     "Soal Penalaran:\n"
     "Soal 1: Ibu pergi ke pasar membeli apel dan pisang. Ibu membeli apa saja?\n"
     "Soal 2: Adik bangun pagi lalu mandi dan sarapan. Apa yang dilakukan adik setelah bangun tidur?\n"
     "Soal 3: Matahari bersinar pada waktu ...\n"
     "Soal 4: Ikan hidup di dalam ...\n"
     "Soal 5: Kita mencuci tangan sebelum ...\n\n"
     "Sumber belajar tambahan:\n"
     "• Tonton Video: Belajar Membaca Anak TK/SD\n"
     "• Latihan Soal Penalaran Tambahan\n"
     "• Buku Bahasa Indonesia — Kemendikbud"),

    ("Modul 3 — Rukun Iman, Rukun Islam, dan Malaikat", "Al-Qur’an & Pendidikan Agama",
     "Rukun Iman:\n"
     "1. Percaya kepada Allah\n"
     "2. Percaya kepada Malaikat\n"
     "3. Percaya kepada Kitab Allah\n"
     "4. Percaya kepada Rasulullah\n"
     "5. Percaya kepada Hari Kiamat\n"
     "6. Percaya kepada Qada dan Qadar\n\n"
     "Rukun Islam:\n"
     "1. Mengucap Syahadat\n"
     "2. Mendirikan Shalat\n"
     "3. Berpuasa Ramadhan\n"
     "4. Membayar Zakat\n"
     "5. Menunaikan Haji\n\n"
     "Nama Malaikat & Tugasnya:\n"
     "• Jibril → Menyampaikan wahyu\n"
     "• Mikail → Membagikan rezeki\n"
     "• Israfil → Meniup sangkakala\n"
     "• Izrail → Mencabut nyawa\n\n"
     "Sumber belajar tambahan:\n"
     "• Video: Rukun Iman & Rukun Islam\n"
     "• Baca: Penjelasan Lengkap Rukun Iman\n"
     "• Video: Kisah Para Nabi\n"
     "• Baca: Asmaul Husna Lengkap"),

    ("Modul 4 — Mewarnai", "Mewarnai",
     "Tema gambar:\n"
     "• Buah-buahan: Apel, Pisang, Jeruk, Anggur\n"
     "• Hewan: Kucing, Anjing, Kelinci, Ayam, Burung\n"
     "• Lingkungan: Rumah, Sekolah, Masjid, Pohon, Bunga\n"
     "• Kendaraan: Sepeda, Mobil, Bus, Kapal, Pesawat\n\n"
     "Halaman mewarnai siap cetak:\n"
     "• Gambar Mewarnai Buah\n"
     "• Gambar Mewarnai Hewan\n"
     "• Gambar Mewarnai Masjid & Sekolah\n"
     "• Gambar Mewarnai Kendaraan\n"
     "• Unduh: Halaman Mewarnai Gratis"),

    ("Materi Tambahan", "Materi Tambahan",
     "Ingin belajar lebih banyak? Buka sumber berikut:\n"
     "• Channel YouTube: Kakata — Belajar Sambil Bermain\n"
     "• Channel: Dunia Anak Islam\n"
     "• Buku PAUD — Kemendikbud"),
]


def pasang(c):
    """Ganti seluruh isi tabel materi. c = koneksi sqlite3. Materi dibuat untuk kedua kelas."""
    c.execute("DELETE FROM materi")
    for kelas in ("sore", "malam"):
        for i, (judul, mapel, isi) in enumerate(MODUL, 1):
            c.execute("INSERT INTO materi(id,judul,mapel,kelas_id,isi) VALUES(?,?,?,?,?)",
                      (f"mod{i}-{kelas}", judul, mapel, kelas, isi))


if __name__ == "__main__":
    db = os.environ.get("DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "tpq.db"))
    c = sqlite3.connect(db)
    c.execute("PRAGMA foreign_keys=ON")
    pasang(c)
    c.commit(); c.close()
    print("Materi modul terpasang di", db)