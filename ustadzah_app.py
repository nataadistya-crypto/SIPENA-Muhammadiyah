import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import sqlite3
from datetime import datetime

# ====================== 🎨 PENGATURAN WARNA & FONT ======================
WARNA_UTAMA = '#4A90E2'        # Biru utama
WARNA_SEKUNDER = '#87CEEB'     # Biru muda
WARNA_LATAR = '#F0F7FF'        # Biru sangat muda (latar)
WARNA_MUDA = '#D6EAF8'         # Biru pucat
WARNA_PUTIH = '#FFFFFF'
WARNA_TULISAN = '#2C3E50'
WARNA_HIJAU = '#27AE60'
WARNA_MERAH = '#E74C3C'
WARNA_ABU = '#95A5A6'

FONT_JUDUL = ("Comic Sans MS", 20, "bold")
FONT_JUDUL2 = ("Comic Sans MS", 15, "bold")
FONT_JUDUL3 = ("Comic Sans MS", 12, "bold")
FONT_TEKS = ("Segoe UI", 11)
FONT_TOMBOL = ("Segoe UI", 10, "bold")
FONT_KECIL = ("Segoe UI", 9)

DB_FILE = 'sipena_db.db'

# ====================== 🗄️ INISIALISASI DATABASE ======================
def buat_database():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS ustadzah (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        sandi TEXT NOT NULL,
        email TEXT,
        proyek TEXT DEFAULT 'SIPENA Muhammadiyah'
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS murid (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        umur INTEGER,
        alamat TEXT,
        id_ortu INTEGER
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

# ====================== 👩‍🏫 APLIKASI USTADZAH ======================
class UstadzahApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🌊 SIPENA — Ustadzah")
        self.root.geometry("950x650")
        self.root.configure(bg=WARNA_LATAR)
        self.nama = ""
        self.tampilkan_pilihan_awal()

    def bersihkan_halaman(self):
        for w in self.root.winfo_children():
            w.destroy()

    def daftar_nama_anak(self):
        conn = sqlite3.connect(DB_FILE)
        d = [r[0] for r in conn.execute("SELECT nama FROM murid ORDER BY nama")]
        conn.close()
        return d

    def tampilkan_pilihan_awal(self):
        self.bersihkan_halaman()
        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="🌊 SIPENA", font=("Comic Sans MS", 36, "bold"),
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,5))
        tk.Label(utama, text="Sistem Informasi Pendidikan Anak — Ustadzah",
                font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_LATAR).pack(pady=(0,50))

        tk.Button(utama, text="🔑 MASUK AKUN", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=50, pady=12, command=self.tampilkan_login).pack(pady=10)
        tk.Button(utama, text="✨ DAFTAR AKUN BARU", font=FONT_TOMBOL, bg=WARNA_SEKUNDER, fg='white',
                relief='flat', padx=50, pady=12, command=self.tampilkan_daftar).pack(pady=10)

    def tampilkan_daftar(self):
        self.bersihkan_halaman()
        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="✨ Daftar Akun Ustadzah", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,25))

        f = tk.Frame(utama, bg=WARNA_PUTIH, padx=40, pady=30)
        f.pack()

        tk.Label(f, text="Nama Lengkap", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_nama = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_nama.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Email", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_email = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_email.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Username", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_user = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_user.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Kata Sandi", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_sandi = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1, show='•')
        e_sandi.pack(pady=(5,20), fill='x')

        def simpan():
            n = e_nama.get().strip()
            u = e_user.get().strip()
            s = e_sandi.get()
            em = e_email.get().strip()

            if not n or not u or not s:
                messagebox.showwarning("Peringatan", "Lengkapi semua data ya! 😊")
                return

            conn = sqlite3.connect(DB_FILE)
            try:
                conn.execute("INSERT INTO ustadzah VALUES (NULL, ?, ?, ?, ?, 'SIPENA Muhammadiyah')",
                            (n, u, s, em))
                conn.commit()
                messagebox.showinfo("Berhasil 🎉", "Akun berhasil dibuat! Silakan masuk.")
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

        tk.Label(utama, text="🔑 Masuk Akun Ustadzah", font=FONT_JUDUL2,
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
            c.execute("SELECT nama FROM ustadzah WHERE username=? AND sandi=?", (u, s))
            hasil = c.fetchone()
            conn.close()
            if hasil:
                self.nama = hasil[0]
                self.halaman_beranda()
            else:
                messagebox.showerror("Gagal", "❌ Username atau sandi salah!")

        tk.Button(f, text="🔑 MASUK", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=30, pady=8, command=masuk).pack(pady=(0,10))
        tk.Button(utama, text="← Kembali", font=FONT_KECIL, fg=WARNA_TULISAN,
                bg=WARNA_LATAR, relief='flat', command=self.tampilkan_pilihan_awal).pack()

    def buat_menu(self):
        mb = tk.Menu(self.root)
        self.root.config(menu=mb)
        m = tk.Menu(mb, tearoff=0)
        m.add_command(label="🏠 Beranda", command=self.halaman_beranda)
        m.add_separator()
        m.add_command(label="👶 Data Murid", command=self.halaman_murid)
        m.add_command(label="📋 Absensi", command=self.halaman_absen)
        m.add_command(label="✏️ Catat Nilai", command=self.halaman_nilai)
        m.add_command(label="🎮 Kuis & Poin", command=self.halaman_game)
        m.add_command(label="📚 Modul Materi", command=self.halaman_modul)
        m.add_separator()
        m.add_command(label="🚪 Keluar", command=self.tampilkan_pilihan_awal)
        mb.add_cascade(label="📋 Menu", menu=m)

    def halaman_beranda(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=40, pady=40)

        tk.Label(u, text=f"Assalamu'alaikum, {self.nama} 🌊", font=FONT_JUDUL,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w')
        tk.Label(u, text=f"📅 {datetime.now().strftime('%A, %d %B %Y')}",
                font=FONT_TEKS, fg=WARNA_ABU, bg=WARNA_LATAR).pack(anchor='w', pady=(0,30))

        kartu = [
            ("👶", "Data Murid", "Daftarkan anak didik", self.halaman_murid),
            ("📋", "Absensi", "Catat kehadiran harian", self.halaman_absen),
            ("✏️", "Nilai", "Rekam hasil belajar", self.halaman_nilai),
            ("🎮", "Kuis & Poin", "Berikan apresiasi anak", self.halaman_game),
            ("📚", "Modul Materi", "Bagikan materi belajar", self.halaman_modul)
        ]

        g = tk.Frame(u, bg=WARNA_LATAR)
        g.pack()
        
        for i, (ikon, judul, des, fungsi) in enumerate(kartu):
            f = tk.Frame(g, bg=WARNA_PUTIH, padx=25, pady=20, cursor='hand2')
            f.grid(row=i//3, column=i%3, padx=12, pady=12)
            
            f.bind("<Button-1>", lambda e, f=fungsi: f())
            
            tk.Label(f, text=ikon, font=("Segoe UI", 35), bg=WARNA_PUTIH).pack()
            tk.Label(f, text=judul, font=FONT_JUDUL3, fg=WARNA_UTAMA, bg=WARNA_PUTIH, pady=5).pack()
            tk.Label(f, text=des, font=FONT_KECIL, fg=WARNA_ABU, bg=WARNA_PUTIH).pack()
            
            for anak in f.winfo_children():
                anak.bind("<Button-1>", lambda e, f=fungsi: f())

    def halaman_murid(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="👶 Data Murid", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        f = tk.Frame(u, bg=WARNA_MUDA, padx=15, pady=15)
        f.pack(fill='x', pady=(0,15))

        tk.Label(f, text="Nama Anak:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=0, sticky='e')
        e_nama = tk.Entry(f, font=FONT_TEKS, width=30)
        e_nama.grid(row=0, column=1, padx=8)

        tk.Label(f, text="Umur:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=2, sticky='e')
        e_umur = tk.Entry(f, font=FONT_TEKS, width=10)
        e_umur.grid(row=0, column=3, padx=8)

        tk.Label(f, text="Alamat:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=1, column=0, sticky='e')
        e_alamat = tk.Entry(f, font=FONT_TEKS, width=55)
        e_alamat.grid(row=1, column=1, columnspan=3, padx=8, pady=5)

        def simpan():
            nama = e_nama.get().strip()
            if not nama:
                messagebox.showwarning("Peringatan", "Nama anak harus diisi!")
                return
            conn = sqlite3.connect(DB_FILE)
            conn.execute("INSERT INTO murid VALUES (NULL, ?, ?, ?, NULL)",
                        (nama, e_umur.get().strip() or None, e_alamat.get().strip()))
            conn.commit()
            conn.close()
            e_nama.delete(0,'end'); e_umur.delete(0,'end'); e_alamat.delete(0,'end')
            muat_tabel()
            messagebox.showinfo("Berhasil ✅", f"{nama} sudah terdaftar!")

        tk.Button(f, text="➕ Tambah", font=FONT_TOMBOL, bg=WARNA_HIJAU, fg='white',
                relief='flat', command=simpan).grid(row=0, column=4, rowspan=2, padx=15)

        kolom = ('ID', 'Nama', 'Umur', 'Alamat')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=8)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=180)
        t.pack(fill='both', expand=True)

        def muat_tabel():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT * FROM murid ORDER BY nama"):
                t.insert('end', values=d)
            conn.close()

        muat_tabel()

    def halaman_absen(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="📋 Absensi Santri", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        f = tk.Frame(u, bg=WARNA_MUDA, padx=15, pady=15)
        f.pack(fill='x', pady=(0,15))

        tk.Label(f, text="Tanggal:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=0, sticky='e')
        e_tgl = tk.Entry(f, font=FONT_TEKS, width=15)
        e_tgl.insert(0, datetime.now().strftime("%Y-%m-%d"))
        e_tgl.grid(row=0, column=1, padx=5)

        tk.Label(f, text="Nama Anak:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=2, sticky='e')
        cb_nama = ttk.Combobox(f, font=FONT_TEKS, width=25, values=self.daftar_nama_anak())
        cb_nama.grid(row=0, column=3, padx=5)

        tk.Label(f, text="Status:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=4, sticky='e')
        st = ttk.Combobox(f, font=FONT_TEKS, width=12, values=["✅ Hadir", "📝 Izin", "🤒 Sakit", "❌ Alfa"])
        st.set("✅ Hadir")
        st.grid(row=0, column=5, padx=5)

        def simpan():
            if not cb_nama.get():
                messagebox.showwarning("Peringatan", "Pilih nama anak dulu ya!")
                return
            conn = sqlite3.connect(DB_FILE)
            conn.execute("INSERT INTO absensi VALUES (NULL, ?, ?, ?)",
                        (e_tgl.get(), cb_nama.get(), st.get()))
            conn.commit()
            conn.close()
            muat_tabel()
            messagebox.showinfo("Tersimpan ✅", "Absensi tercatat!")

        tk.Button(f, text="💾 Simpan", font=FONT_TOMBOL, bg=WARNA_HIJAU, fg='white',
                relief='flat', command=simpan).grid(row=0, column=6, padx=10)

        kolom = ('Tanggal', 'Nama Anak', 'Status')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=8)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=250)
        t.pack(fill='both', expand=True)

        def muat_tabel():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT tanggal, nama_murid, status FROM absensi ORDER BY id DESC"):
                t.insert('end', values=d)
            conn.close()

        muat_tabel()

    def halaman_nilai(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="✏️ Catat Nilai", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        f = tk.Frame(u, bg=WARNA_MUDA, padx=15, pady=15)
        f.pack(fill='x', pady=(0,15))

        tk.Label(f, text="Nama Anak:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=0, sticky='e')
        cb_anak = ttk.Combobox(f, font=FONT_TEKS, width=25, values=self.daftar_nama_anak())
        cb_anak.grid(row=0, column=1, padx=5)

        tk.Label(f, text="Mata Pelajaran:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=1, column=0, sticky='e')
        cb_mapel = ttk.Combobox(f, font=FONT_TEKS, width=25,
                                values=["Matematika", "Bahasa Arab", "Bahasa Indonesia", "Pendidikan Agama"])
        cb_mapel.set("Matematika")
        cb_mapel.grid(row=1, column=1, padx=5)

        tk.Label(f, text="Nilai:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=2, column=0, sticky='e')
        e_nilai = tk.Entry(f, font=FONT_TEKS, width=30)
        e_nilai.grid(row=2, column=1, padx=5)

        tk.Label(f, text="Keterangan:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=3, column=0, sticky='ne')
        e_ket = tk.Text(f, font=FONT_TEKS, width=35, height=3)
        e_ket.insert('1.0', "Semangat belajarnya! 🌟")
        e_ket.grid(row=3, column=1, padx=5, pady=5)

        def simpan():
            if not cb_anak.get() or not e_nilai.get():
                messagebox.showwarning("Peringatan", "Lengkapi data dulu ya!")
                return
            conn = sqlite3.connect(DB_FILE)
            conn.execute("INSERT INTO nilai VALUES (NULL, ?, ?, ?, ?, ?)",
                        (cb_anak.get(), cb_mapel.get(), int(e_nilai.get()),
                         e_ket.get('1.0', 'end-1c'), datetime.now().strftime("%Y-%m-%d")))
            conn.commit()
            conn.close()
            e_nilai.delete(0,'end'); e_ket.delete('1.0','end')
            e_ket.insert('1.0', "Semangat belajarnya! 🌟")
            muat_tabel()
            messagebox.showinfo("Tersimpan ✅", "Nilai sudah dicatat!")

        tk.Button(f, text="💾 Simpan", font=FONT_TOMBOL, bg=WARNA_HIJAU, fg='white',
                relief='flat', command=simpan).grid(row=4, column=1, sticky='w', pady=8)

        kolom = ('Anak', 'Mata Pelajaran', 'Nilai', 'Tanggal')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=7)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=200)
        t.pack(fill='both', expand=True)

        def muat_tabel():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT nama_anak, mata_pelajaran, nilai, tanggal FROM nilai ORDER BY id DESC"):
                t.insert('end', values=d)
            conn.close()

        muat_tabel()

    def halaman_game(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="🎮 Kuis & Poin", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        f = tk.Frame(u, bg=WARNA_MUDA, padx=15, pady=15)
        f.pack(fill='x', pady=(0,15))

        tk.Label(f, text="Nama Anak:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=0, column=0, sticky='e')
        cb_anak = ttk.Combobox(f, font=FONT_TEKS, width=30, values=self.daftar_nama_anak())
        cb_anak.grid(row=0, column=1, padx=5)

        tk.Label(f, text="Soal:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=1, column=0, sticky='ne')
        e_soal = tk.Text(f, font=FONT_TEKS, width=40, height=3)
        e_soal.grid(row=1, column=1, padx=5, pady=5)

        tk.Label(f, text="Jawaban:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=2, column=0, sticky='e')
        e_jawab = tk.Entry(f, font=FONT_TEKS, width=40)
        e_jawab.grid(row=2, column=1, padx=5)

        tk.Label(f, text="Poin:", font=FONT_TEKS, bg=WARNA_MUDA).grid(row=3, column=0, sticky='e')
        e_poin = tk.Entry(f, font=FONT_TEKS, width=10)
        e_poin.insert(0, "10")
        e_poin.grid(row=3, column=1, sticky='w', padx=5)

        def simpan():
            if not cb_anak.get() or not e_soal.get('1.0','end-1c').strip():
                messagebox.showwarning("Peringatan", "Lengkapi nama dan soal dulu ya!")
                return
            conn = sqlite3.connect(DB_FILE)
            conn.execute("INSERT INTO hasil_game VALUES (NULL, ?, ?, ?, ?, ?)",
                        (cb_anak.get(), e_soal.get('1.0','end-1c'),
                         e_jawab.get().strip(), int(e_poin.get()),
                         datetime.now().strftime("%Y-%m-%d %H:%M")))
            conn.commit()
            conn.close()
            e_soal.delete('1.0','end'); e_jawab.delete(0,'end')
            muat_tabel()
            messagebox.showinfo("Berhasil ✅", f"Poin {e_poin.get()} dicatat!")

        tk.Button(f, text="✅ Simpan", font=FONT_TOMBOL, bg=WARNA_HIJAU, fg='white',
                relief='flat', command=simpan).grid(row=4, column=1, sticky='w', pady=8)

        kolom = ('Anak', 'Soal', 'Jawaban', 'Poin', 'Tanggal')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=7)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=150)
        t.pack(fill='both', expand=True)

        def muat_tabel():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT * FROM hasil_game ORDER BY id DESC"):
                t.insert('end', values=d)
            conn.close()

        muat_tabel()

    def halaman_modul(self):
        self.bersihkan_halaman()
        self.buat_menu()

        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="📚 Modul Materi Pembelajaran", font=FONT_JUDUL2,
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        notebook = ttk.Notebook(u)
        notebook.pack(fill='both', expand=True)

        f1 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks1 = scrolledtext.ScrolledText(f1, wrap='word', font=FONT_TEKS)
        teks1.pack(fill='both', expand=True)
        teks1.insert('1.0', """🔤 MODUL BAHASA ARAB — Muqrodat
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

Semangat belajarnya! 🌟""")
        teks1.config(state='disabled')
        notebook.add(f1, text="🔤 Bahasa Arab")

        f2 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks2 = scrolledtext.ScrolledText(f2, wrap='word', font=FONT_TEKS)
        teks2.pack(fill='both', expand=True)
        teks2.insert('1.0', """🔢 MODUL MATEMATIKA
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

Semangat belajarnya! 🌟""")
        teks2.config(state='disabled')
        notebook.add(f2, text="🔢 Matematika")

        f3 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks3 = scrolledtext.ScrolledText(f3, wrap='word', font=FONT_TEKS)
        teks3.pack(fill='both', expand=True)
        teks3.insert('1.0', """☪️ MODUL PENDIDIKAN AGAMA
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

Semangat belajarnya! 🌟""")
        teks3.config(state='disabled')
        notebook.add(f3, text="☪️ Pendidikan Agama")

        f4 = tk.Frame(notebook, bg=WARNA_PUTIH, padx=15, pady=15)
        teks4 = scrolledtext.ScrolledText(f4, wrap='word', font=FONT_TEKS)
        teks4.pack(fill='both', expand=True)
        teks4.insert('1.0', """📝 MODUL BAHASA INDONESIA
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

Semangat belajarnya! 🌟""")
        teks4.config(state='disabled')
        notebook.add(f4, text="📝 Bahasa Indonesia")

if __name__ == "__main__":
    root = tk.Tk()
    app = UstadzahApp(root)
    root.mainloop()