import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import sqlite3
from datetime import datetime

# ====================== 🎨 PENGATURAN WARNA & FONT ======================
WARNA_UTAMA = '#27AE60'        # Hijau utama
WARNA_SEKUNDER = '#7DCEA0'     # Hijau muda
WARNA_LATAR = '#F0FFF4'        # Hijau sangat muda
WARNA_MUDA = '#D5F5DC'         # Hijau pucat
WARNA_PUTIH = '#FFFFFF'
WARNA_TULISAN = '#2C3E50'
WARNA_BIRU = '#4A90E2'
WARNA_MERAH = '#E74C3C'
WARNA_ABU = '#95A5A6'

FONT_JUDUL = ("Comic Sans MS", 20, "bold")
FONT_JUDUL2 = ("Comic Sans MS", 15, "bold")
FONT_TEKS = ("Segoe UI", 11)
FONT_TOMBOL = ("Segoe UI", 10, "bold")
FONT_KECIL = ("Segoe UI", 9)

DB_FILE = 'sipena_db.db'

# ====================== 🗄️ INISIALISASI DATABASE ======================
def buat_database():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS orang_tua (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_wali TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        sandi TEXT NOT NULL,
        nama_anak TEXT NOT NULL,
        email TEXT,
        proyek TEXT DEFAULT 'SIPENA Muhammadiyah'
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        nama_murid TEXT NOT NULL,
        status TEXT NOT NULL
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS nilai (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_anak TEXT NOT NULL,
        mata_pelajaran TEXT NOT NULL,
        nilai INTEGER NOT NULL,
        keterangan TEXT,
        tanggal TEXT NOT NULL
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS hasil_game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_murid TEXT NOT NULL,
        soal TEXT NOT NULL,
        jawaban TEXT,
        poin INTEGER NOT NULL,
        tanggal TEXT NOT NULL
    )''')

    conn.commit()
    conn.close()

buat_database()

# ====================== 👨‍👩‍👧 APLIKASI ORANG TUA ======================
class OrangTuaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🌻 SIPENA — Orang Tua")
        self.root.geometry("950x650")
        self.root.configure(bg=WARNA_LATAR)
        self.nama_wali = ""
        self.nama_anak = ""
        self.menu_dibuat = False
        self.tampilkan_pilihan_awal()

    def bersihkan_halaman(self):
        for w in self.root.winfo_children():
            if not isinstance(w, tk.Menu):
                w.destroy()

    def tampilkan_pilihan_awal(self):
        self.bersihkan_halaman()
        if self.menu_dibuat:
            self.root.config(menu="")
            self.menu_dibuat = False

        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="🌻 SIPENA", font=("Comic Sans MS", 36, "bold"),
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,5))
        tk.Label(utama, text="Sistem Informasi Pendidikan Anak — Orang Tua",
                font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_LATAR).pack(pady=(0,50))

        tk.Button(utama, text="🔑 MASUK AKUN", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=50, pady=12, command=self.tampilkan_login).pack(pady=10)
        tk.Button(utama, text="✨ DAFTAR AKUN BARU", font=FONT_TOMBOL, bg=WARNA_BIRU, fg='white',
                relief='flat', padx=50, pady=12, command=self.tampilkan_daftar).pack(pady=10)

    def tampilkan_daftar(self):
        self.bersihkan_halaman()
        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="✨ Daftar Akun Orang Tua", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,25))

        f = tk.Frame(utama, bg=WARNA_PUTIH, padx=40, pady=30)
        f.pack()

        tk.Label(f, text="Nama Wali / Orang Tua", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_wali = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_wali.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Nama Anak", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_anak = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_anak.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Email (untuk menerima informasi)", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_email = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_email.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Username", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_user = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_user.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Kata Sandi", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_sandi = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1, show='•')
        e_sandi.pack(pady=(5,20), fill='x')

        def simpan():
            nw = e_wali.get().strip()
            na = e_anak.get().strip()
            em = e_email.get().strip()
            us = e_user.get().strip()
            sa = e_sandi.get()

            if not nw or not na or not us or not sa:
                messagebox.showwarning("Peringatan", "Lengkapi semua data yang wajib diisi ya! 😊")
                return

            conn = sqlite3.connect(DB_FILE)
            try:
                conn.execute("INSERT INTO orang_tua VALUES (NULL, ?, ?, ?, ?, ?, 'SIPENA Muhammadiyah')",
                            (nw, us, sa, na, em))
                conn.commit()
                messagebox.showinfo("Berhasil 🎉", f"Akun berhasil dibuat!\nEmail: {em}\nSiap menerima informasi dari Ustadzah.")
                self.tampilkan_login()
            except sqlite3.IntegrityError:
                messagebox.showerror("Ups", "Username sudah digunakan, coba yang lain ya")
            conn.close()

        tk.Button(f, text="✅ DAFTAR SEKARANG", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=30, pady=8, command=simpan).pack(pady=(0,10))
        tk.Button(utama, text="← Kembali", font=FONT_KECIL, fg=WARNA_TULISAN,
                bg=WARNA_LATAR, relief='flat', command=self.tampilkan_pilihan_awal).pack()

    def tampilkan_login(self):
        self.bersihkan_halaman()
        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="🔑 Masuk Akun Orang Tua", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,30))

        f = tk.Frame(utama, bg=WARNA_PUTIH, padx=40, pady=30)
        f.pack()

        tk.Label(f, text="Username", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_user = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_user.pack(pady=(5,15), fill='x')

        tk.Label(f, text="Kata Sandi", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_sandi = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1, show='•')
        e_sandi.pack(pady=(5,20), fill='x')

        def masuk():
            u = e_user.get().strip()
            s = e_sandi.get()
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT nama_wali, nama_anak FROM orang_tua WHERE username=? AND sandi=?", (u, s))
            hasil = c.fetchone()
            conn.close()
            if hasil:
                self.nama_wali, self.nama_anak = hasil
                self.halaman_beranda()
            else:
                messagebox.showerror("Gagal", "❌ Username atau sandi salah!")

        tk.Button(f, text="🔑 MASUK", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=30, pady=8, command=masuk).pack(pady=(0,10))
        tk.Button(utama, text="← Kembali", font=FONT_KECIL, fg=WARNA_TULISAN,
                bg=WARNA_LATAR, relief='flat', command=self.tampilkan_pilihan_awal).pack()

    def buat_menu(self):
        if not self.menu_dibuat:
            mb = tk.Menu(self.root)
            self.root.config(menu=mb)
            m = tk.Menu(mb, tearoff=0)
            m.add_command(label="🏠 Beranda", command=self.halaman_beranda)
            m.add_separator()
            m.add_command(label="📋 Riwayat Absensi", command=self.halaman_absen)
            m.add_command(label="📊 Hasil Belajar & Nilai", command=self.halaman_nilai)
            m.add_command(label="🎮 Poin & Prestasi", command=self.halaman_poin)
            m.add_command(label="📚 Materi Pembelajaran", command=self.halaman_materi)
            m.add_command(label="📂 Dokumen & Foto", command=self.halaman_dokumen)
            m.add_separator()
            m.add_command(label="🚪 Keluar", command=self.tampilkan_pilihan_awal)
            mb.add_cascade(label="📋 Menu", menu=m)
            self.menu_dibuat = True

    def halaman_beranda(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=40, pady=40)

        tk.Label(u, text=f"Halo, {self.nama_wali}! 🌻", font=FONT_JUDUL,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w')
        tk.Label(u, text=f"Ananda: {self.nama_anak}", font=FONT_JUDUL2,
                fg=WARNA_BIRU, bg=WARNA_LATAR).pack(anchor='w')
        tk.Label(u, text=f"📅 {datetime.now().strftime('%A, %d %B %Y')}",
                font=FONT_TEKS, fg=WARNA_ABU, bg=WARNA_LATAR).pack(anchor='w', pady=(0,30))

        conn = sqlite3.connect(DB_FILE)
        jml_hadir = conn.execute("SELECT COUNT(*) FROM absensi WHERE nama_murid=? AND status LIKE '%Hadir%'", (self.nama_anak,)).fetchone()[0]
        jml_tidak_hadir = conn.execute("SELECT COUNT(*) FROM absensi WHERE nama_murid=? AND status NOT LIKE '%Hadir%'", (self.nama_anak,)).fetchone()[0]
        jml_nilai = conn.execute("SELECT AVG(nilai) FROM nilai WHERE nama_anak=?", (self.nama_anak,)).fetchone()[0]
        total_poin = conn.execute("SELECT SUM(poin) FROM hasil_game WHERE nama_murid=?", (self.nama_anak,)).fetchone()[0] or 0
        conn.close()

        kartu = [
            ("✅", "Kehadiran", f"{jml_hadir} hari hadir"),
            ("⚠️", "Tidak Hadir", f"{jml_tidak_hadir} kali"),
            ("📊", "Rata-rata Nilai", f"{jml_nilai:.1f}" if jml_nilai else "-"),
            ("⭐", "Total Poin", f"{total_poin} poin")
        ]

        g = tk.Frame(u, bg=WARNA_LATAR)
        g.pack()
        for i, (ikon, judul, nilai) in enumerate(kartu):
            f = tk.Frame(g, bg=WARNA_PUTIH, padx=30, pady=25)
            f.grid(row=i//2, column=i%2, padx=12, pady=12)
            tk.Label(f, text=ikon, font=("Segoe UI", 35), bg=WARNA_PUTIH).pack()
            tk.Label(f, text=judul, font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH, pady=5).pack()
            tk.Label(f, text=nilai, font=("Comic Sans MS", 22, "bold"),
                    fg=WARNA_UTAMA, bg=WARNA_PUTIH).pack()

        tk.Label(u, text="\n📧 Informasi akan dikirim ke email yang terdaftar dari Ustadzah",
                font=FONT_KECIL, fg=WARNA_BIRU, bg=WARNA_LATAR).pack(pady=(20,0))
        tk.Label(u, text="💡 Semangat belajarnya Nak! Semoga ilmu bermanfaat dunia akhirat 🌟",
                font=FONT_TEKS, fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(10,0))

    def halaman_absen(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text=f"📋 Riwayat Absensi — {self.nama_anak}", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        kolom = ('Tanggal', 'Status')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=12)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=400)
        t.pack(fill='both', expand=True)

        def muat():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT tanggal, status FROM absensi WHERE nama_murid=? ORDER BY id DESC", (self.nama_anak,)):
                t.insert('end', values=d)
            conn.close()

        muat()
        tk.Button(u, text="🔄 Muat Ulang", font=FONT_TOMBOL, bg=WARNA_BIRU, fg='white',
                relief='flat', command=muat).pack(pady=10)

    def halaman_nilai(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text=f"📊 Hasil Belajar & Nilai — {self.nama_anak}", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        kolom = ('Mata Pelajaran', 'Nilai', 'Keterangan', 'Tanggal')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=12)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=200)
        t.pack(fill='both', expand=True)

        def muat():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT mata_pelajaran, nilai, keterangan, tanggal FROM nilai WHERE nama_anak=? ORDER BY id DESC", (self.nama_anak,)):
                t.insert('end', values=d)
            conn.close()

        muat()
        tk.Button(u, text="🔄 Muat Ulang", font=FONT_TOMBOL, bg=WARNA_BIRU, fg='white',
                relief='flat', command=muat).pack(pady=10)

    def halaman_poin(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text=f"🎮 Poin & Prestasi — {self.nama_anak}", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        kolom = ('Soal', 'Jawaban', 'Poin', 'Tanggal')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=12)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=200)
        t.pack(fill='both', expand=True)

        def muat():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT soal, jawaban, poin, tanggal FROM hasil_game WHERE nama_murid=? ORDER BY id DESC", (self.nama_anak,)):
                t.insert('end', values=d)
            conn.close()

        muat()
        tk.Button(u, text="🔄 Muat Ulang", font=FONT_TOMBOL, bg=WARNA_BIRU, fg='white',
                relief='flat', command=muat).pack(pady=10)

    def halaman_materi(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="📚 Materi Pembelajaran", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))
        tk.Label(u, text="📂 Materi diterima dari Ustadzah — sama seperti yang dipelajari di kelas",
                font=FONT_KECIL, fg=WARNA_BIRU, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        notebook = ttk.Notebook(u)
        notebook.pack(fill='both', expand=True)

        f1 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks1 = scrolledtext.ScrolledText(f1, wrap='word', font=FONT_TEKS)
        teks1.pack(fill='both', expand=True)
        teks1.insert('1.0', """🔤 BAHASA ARAB — Muqrodat
════════════════════════════════════

👨 أَبٌ = Ayah
👩 أُمٌّ = Ibu
👦 وَلَدٌ = Anak laki-laki
👧 بِنْتٌ = Anak perempuan
🏫 مَدْرَسَةٌ = Sekolah
📖 كِتَابٌ = Buku
☀️ الشَّمْسُ = Matahari
🌙 الْقَمَرُ = Bulan
💧 الْمَاءُ = Air
🍞 الطَّعَامُ = Makanan

📧 Materi dikirim dari Ustadzah ke email orang tua
🖼️ Gambar pendukung: format JPG/JPEG — buka dari menu Dokumen & Foto

Semangat belajarnya! 🌟""")
        teks1.config(state='disabled')
        notebook.add(f1, text="🔤 Bahasa Arab")

        f2 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks2 = scrolledtext.ScrolledText(f2, wrap='word', font=FONT_TEKS)
        teks2.pack(fill='both', expand=True)
        teks2.insert('1.0', """🔢 MATEMATIKA
══════════════════

➕ PENJUMLAHAN
2 + 3 = 5
4 + 1 = 5
6 + 2 = 8

➖ PENGURANGAN
5 - 2 = 3
7 - 4 = 3
10 - 5 = 5

🧠 PENALARAN
- 5 apel dimakan 2 → sisa 3
- 4 kelereng + 3 kelereng = 7 kelereng

📧 Materi dikirim dari Ustadzah ke email orang tua
🖼️ Gambar pendukung: format JPG/JPEG — buka dari menu Dokumen & Foto

Semangat belajarnya! 🌟""")
        teks2.config(state='disabled')
        notebook.add(f2, text="🔢 Matematika")

        f3 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks3 = scrolledtext.ScrolledText(f3, wrap='word', font=FONT_TEKS)
        teks3.pack(fill='both', expand=True)
        teks3.insert('1.0', """☪️ PENDIDIKAN AGAMA
════════════════════════

🕌 RUKUN IMAN
1. Percaya kepada Allah SWT
2. Percaya kepada Malaikat-Nya
3. Percaya kepada Kitab-kitab-Nya
4. Percaya kepada Rasul-rasul-Nya
5. Percaya kepada Hari Kiamat
6. Percaya kepada Qada dan Qadar

🌙 RUKUN ISLAM
1. Syahadat
2. Shalat
3. Puasa
4. Zakat
5. Haji

📧 Materi dikirim dari Ustadzah ke email orang tua
🖼️ Gambar pendukung: format JPG/JPEG — buka dari menu Dokumen & Foto

Semangat belajarnya! 🌟""")
        teks3.config(state='disabled')
        notebook.add(f3, text="☪️ Pendidikan Agama")

        f4 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks4 = scrolledtext.ScrolledText(f4, wrap='word', font=FONT_TEKS)
        teks4.pack(fill='both', expand=True)
        teks4.insert('1.0', """📝 BAHASA INDONESIA
══════════════════════

📖 MEMBACA
- Adik bermain bola di halaman.
- Ibu memasak nasi di dapur.
- Ayah membaca koran di teras.

✏️ MENULIS
1. Saya suka belajar.
2. Adik dan kakak bermain bersama.
3. Bunga mawar itu indah warnanya.

🎨 MENALAR
- Benda untuk menulis = pensil
- Hewan berkaki 4 = kucing
- Warna langit = biru

📧 Materi dikirim dari Ustadzah ke email orang tua
🖼️ Gambar pendukung: format JPG/JPEG — buka dari menu Dokumen & Foto

Semangat belajarnya! 🌟""")
        teks4.config(state='disabled')
        notebook.add(f4, text="📝 Bahasa Indonesia")

    def halaman_dokumen(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="📂 Dokumen & Foto Pembelajaran", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        f = tk.Frame(u, bg=WARNA_MUDA, padx=20, pady=20)
        f.pack(fill='x', pady=(0,15))

        tk.Label(f, text="📧 Informasi Pengiriman", font=FONT_TEKS + ('bold',),
                fg=WARNA_BIRU, bg=WARNA_MUDA).pack(anchor='w', pady=(0,10))
        tk.Label(f, text="• Dokumen dan foto dikirimkan oleh Ustadzah ke email yang didaftarkan saat pembuatan akun",
                font=FONT_KECIL, fg=WARNA_TULISAN, bg=WARNA_MUDA).pack(anchor='w')
        tk.Label(f, text="• Format file yang dikirim: Gambar (.jpg/.jpeg/.png), Dokumen (.pdf, .docx)",
                font=FONT_KECIL, fg=WARNA_TULISAN, bg=WARNA_MUDA).pack(anchor='w')
        tk.Label(f, text="• Buka email secara berkala untuk menerima materi terbaru dari kelas",
                font=FONT_KECIL, fg=WARNA_TULISAN, bg=WARNA_MUDA).pack(anchor='w')

        f2 = tk.Frame(u, bg=WARNA_PUTIH, padx=20, pady=20)
        f2.pack(fill='both', expand=True)
        tk.Label(f2, text="🖼️ Daftar File yang Telah Diterima", font=FONT_TEKS + ('bold',),
                fg=WARNA_UTAMA, bg=WARNA_PUTIH).pack(anchor='w', pady=(0,15))

        kolom = ('Nama File', 'Jenis', 'Tanggal Diterima', 'Dari')
        t = ttk.Treeview(f2, columns=kolom, show='headings', height=8)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=200)
        t.pack(fill='both', expand=True)

        # Contoh data
        contoh = [
            ("mufrodat_kata_sehari_hari.jpg", "Gambar JPEG", "2026-10-20", "Ustadzah"),
            ("contoh_mewarnai_gambar.jpg", "Gambar JPEG", "2026-10-18", "Ustadzah"),
            ("daftar_nilai_bulan_agustus.jpg", "Gambar JPEG", "2026-10-15", "Ustadzah"),
            ("jadwal_pembelajaran.jpg", "Gambar JPEG", "2026-10-10", "Ustadzah")
        ]
        for d in contoh:
            t.insert('end', values=d)

        tk.Label(f2, text="\n💡 Klik dua kali pada file untuk membuka (simulasi)",
                font=FONT_KECIL, fg=WARNA_ABU, bg=WARNA_PUTIH).pack(pady=(10,0))

if __name__ == "__main__":
    root = tk.Tk()
    app = OrangTuaApp(root)
    root.mainloop()