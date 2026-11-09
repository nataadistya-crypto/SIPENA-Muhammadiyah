import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
from datetime import datetime

# ====================== 🎨 PENGATURAN WARNA & FONT ======================
WARNA_UTAMA = '#6BB8E8'
WARNA_LATAR = '#F0F8FF'
WARNA_MUDA = '#E0EFFC'
WARNA_PUTIH = '#FFFFFF'
WARNA_TULISAN = '#2C3E50'
WARNA_HIJAU = '#70C062'
WARNA_MERAH = '#FF6B6B'
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

    # Tabel Admin
    c.execute('''CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        sandi TEXT NOT NULL,
        nama TEXT NOT NULL
    )''')

    # Tabel Ustadzah
    c.execute('''CREATE TABLE IF NOT EXISTS ustadzah (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        sandi TEXT NOT NULL,
        email TEXT,
        proyek TEXT DEFAULT 'SIPENA Muhammadiyah'
    )''')

    # Tabel Orang Tua
    c.execute('''CREATE TABLE IF NOT EXISTS orang_tua (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_wali TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        sandi TEXT NOT NULL,
        nama_anak TEXT NOT NULL,
        email TEXT,
        proyek TEXT DEFAULT 'SIPENA Muhammadiyah'
    )''')

    # Tabel Murid
    c.execute('''CREATE TABLE IF NOT EXISTS murid (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        umur INTEGER,
        alamat TEXT,
        id_ortu INTEGER
    )''')

    # Tabel Absensi
    c.execute('''CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        nama_murid TEXT NOT NULL,
        status TEXT NOT NULL
    )''')

    # Tabel Nilai
    c.execute('''CREATE TABLE IF NOT EXISTS nilai (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_anak TEXT NOT NULL,
        mata_pelajaran TEXT NOT NULL,
        nilai INTEGER NOT NULL,
        keterangan TEXT,
        tanggal TEXT NOT NULL
    )''')

    # Tabel Hasil Game
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

# ====================== 🔐 APLIKASI ADMIN ======================
class AdminApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🔐 SIPENA — Panel Admin")
        self.root.geometry("900x600")
        self.root.configure(bg=WARNA_LATAR)
        self.nama_admin = ""
        self.tampilkan_login()

    def bersihkan_halaman(self):
        for w in self.root.winfo_children():
            w.destroy()

    def tampilkan_login(self):
        self.bersihkan_halaman()
        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="🔐 MASUK ADMIN", font=FONT_JUDUL, fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,30))
        
        f = tk.Frame(utama, bg=WARNA_PUTIH, padx=50, pady=40)
        f.pack()

        tk.Label(f, text="Username", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_user = tk.Entry(f, font=FONT_TEKS, width=30, relief='flat', bd=1)
        e_user.pack(pady=(5,15), fill='x')

        tk.Label(f, text="Kata Sandi", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_sandi = tk.Entry(f, font=FONT_TEKS, width=30, relief='flat', bd=1, show='•')
        e_sandi.pack(pady=(5,20), fill='x')

        def masuk():
            u = e_user.get().strip()
            s = e_sandi.get()
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT nama FROM admin WHERE username=? AND sandi=?", (u, s))
            hasil = c.fetchone()
            conn.close()
            if hasil:
                self.nama_admin = hasil[0]
                self.halaman_beranda()
            else:
                messagebox.showerror("Gagal", "❌ Username atau sandi salah!")

        tk.Button(f, text="🔑 MASUK", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=30, pady=8, command=masuk).pack()
        
        # Tombol Daftar Akun Baru
        tk.Label(utama, text="\nBelum punya akun?", font=FONT_KECIL, fg=WARNA_ABU, bg=WARNA_LATAR).pack()
        tk.Button(utama, text="✨ DAFTAR AKUN ADMIN BARU", font=FONT_KECIL, 
                bg=WARNA_MUDA, fg=WARNA_TULISAN, relief='flat', padx=20, pady=6,
                command=self.tampilkan_daftar_admin).pack()

    def tampilkan_daftar_admin(self):
        self.bersihkan_halaman()
        utama = tk.Frame(self.root, bg=WARNA_LATAR)
        utama.place(relx=0.5, rely=0.5, anchor='center')

        tk.Label(utama, text="✨ Daftar Akun Admin Baru", font=FONT_JUDUL2, 
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(pady=(0,25))
        
        f = tk.Frame(utama, bg=WARNA_PUTIH, padx=40, pady=30)
        f.pack()

        tk.Label(f, text="Nama Lengkap", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_nama = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_nama.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Username", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_user = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1)
        e_user.pack(pady=(5,12), fill='x')

        tk.Label(f, text="Kata Sandi", font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(anchor='w')
        e_sandi = tk.Entry(f, font=FONT_TEKS, width=35, relief='flat', bd=1, show='•')
        e_sandi.pack(pady=(5,20), fill='x')

        def simpan_admin():
            n = e_nama.get().strip()
            u = e_user.get().strip()
            s = e_sandi.get()
            
            if not n or not u or not s:
                messagebox.showwarning("Peringatan", "Lengkapi semua data ya! 😊")
                return
            
            conn = sqlite3.connect(DB_FILE)
            try:
                conn.execute("INSERT INTO admin VALUES (NULL, ?, ?, ?)", (u, s, n))
                conn.commit()
                messagebox.showinfo("Berhasil 🎉", "Akun Admin berhasil dibuat! Silakan masuk.")
                self.tampilkan_login()
            except sqlite3.IntegrityError:
                messagebox.showerror("Ups", "Username sudah digunakan, coba yang lain ya")
            conn.close()

        tk.Button(f, text="✅ DAFTAR SEKARANG", font=FONT_TOMBOL, bg=WARNA_UTAMA, fg='white',
                relief='flat', padx=30, pady=8, command=simpan_admin).pack(pady=(0,10))
        tk.Button(utama, text="← Kembali ke Login", font=FONT_KECIL, fg=WARNA_TULISAN,
                bg=WARNA_LATAR, relief='flat', command=self.tampilkan_login).pack()

    def buat_menu(self):
        mb = tk.Menu(self.root)
        self.root.config(menu=mb)
        m = tk.Menu(mb, tearoff=0)
        m.add_command(label="🏠 Beranda", command=self.halaman_beranda)
        m.add_separator()
        m.add_command(label="👩‍🏫 Kelola Ustadzah", command=self.halaman_ustadzah)
        m.add_command(label="👨‍👩‍👧 Kelola Orang Tua", command=self.halaman_ortu)
        m.add_command(label="👶 Data Semua Murid", command=self.halaman_murid)
        m.add_separator()
        m.add_command(label="🚪 Keluar", command=self.tampilkan_login)
        mb.add_cascade(label="📋 Menu", menu=m)

    def halaman_beranda(self):
        self.bersihkan_halaman()
        self.buat_menu()
        
        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=40, pady=40)

        tk.Label(u, text=f"Halo, {self.nama_admin}! 👋", font=FONT_JUDUL, 
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w')
        tk.Label(u, text=f"📅 {datetime.now().strftime('%A, %d %B %Y')}", 
                font=FONT_TEKS, fg=WARNA_ABU, bg=WARNA_LATAR).pack(anchor='w', pady=(0,30))

        conn = sqlite3.connect(DB_FILE)
        ju = conn.execute("SELECT COUNT(*) FROM ustadzah").fetchone()[0]
        jo = conn.execute("SELECT COUNT(*) FROM orang_tua").fetchone()[0]
        jm = conn.execute("SELECT COUNT(*) FROM murid").fetchone()[0]
        conn.close()

        kartu = [
            ("👩‍🏫", "Ustadzah Terdaftar", ju),
            ("👨‍👩‍👧", "Orang Tua Terdaftar", jo),
            ("👶", "Total Murid", jm)
        ]

        for ikon, judul, angka in kartu:
            f = tk.Frame(u, bg=WARNA_PUTIH, padx=30, pady=20)
            f.pack(fill='x', pady=10)
            tk.Label(f, text=ikon, font=("Segoe UI", 30), bg=WARNA_PUTIH).pack(side='left')
            tk.Label(f, text=judul, font=FONT_TEKS, fg=WARNA_TULISAN, bg=WARNA_PUTIH).pack(side='left', padx=15)
            tk.Label(f, text=str(angka), font=("Comic Sans MS", 26, "bold"), 
                    fg=WARNA_UTAMA, bg=WARNA_PUTIH).pack(side='right')

    def halaman_ustadzah(self):
        self.bersihkan_halaman()
        self.buat_menu()
        
        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="👩‍🏫 Daftar Akun Ustadzah", font=FONT_JUDUL2, 
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        kolom = ('ID', 'Nama', 'Username', 'Email', 'Proyek')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=12)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=150)
        t.pack(fill='both', expand=True)

        def muat():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT * FROM ustadzah ORDER BY nama"):
                t.insert('end', values=(d[0], d[1], d[2], d[4] or '-', d[5]))
            conn.close()
        
        muat()
        tk.Button(u, text="🔄 Muat Ulang Data", font=FONT_TOMBOL, bg=WARNA_UTAMA, 
                fg='white', relief='flat', command=muat).pack(pady=10)

    def halaman_ortu(self):
        self.bersihkan_halaman()
        self.buat_menu()
        
        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="👨‍👩‍👧 Daftar Akun Orang Tua", font=FONT_JUDUL2, 
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        kolom = ('ID', 'Nama Wali', 'Nama Anak', 'Email', 'Proyek')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=12)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=170)
        t.pack(fill='both', expand=True)

        def muat():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT id, nama_wali, nama_anak, email, proyek FROM orang_tua ORDER BY nama_wali"):
                t.insert('end', values=d)
            conn.close()
        
        muat()
        tk.Button(u, text="🔄 Muat Ulang Data", font=FONT_TOMBOL, bg=WARNA_UTAMA, 
                fg='white', relief='flat', command=muat).pack(pady=10)

    def halaman_murid(self):
        self.bersihkan_halaman()
        self.buat_menu()
        
        u = tk.Frame(self.root, bg=WARNA_LATAR)
        u.pack(fill='both', expand=True, padx=30, pady=25)
        tk.Label(u, text="👶 Data Semua Murid", font=FONT_JUDUL2, 
                fg=WARNA_UTAMA, bg=WARNA_LATAR).pack(anchor='w', pady=(0,15))

        kolom = ('ID', 'Nama', 'Umur', 'Alamat')
        t = ttk.Treeview(u, columns=kolom, show='headings', height=12)
        for c in kolom:
            t.heading(c, text=c)
            t.column(c, width=200)
        t.pack(fill='both', expand=True)

        def muat():
            for i in t.get_children():
                t.delete(i)
            conn = sqlite3.connect(DB_FILE)
            for d in conn.execute("SELECT * FROM murid ORDER BY nama"):
                t.insert('end', values=d)
            conn.close()
        
        muat()
        tk.Button(u, text="🔄 Muat Ulang Data", font=FONT_TOMBOL, bg=WARNA_UTAMA, 
                fg='white', relief='flat', command=muat).pack(pady=10)

if __name__ == "__main__":
    root = tk.Tk()
    app = AdminApp(root)
    root.mainloop()