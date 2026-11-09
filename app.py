"""Server Flask + SQLite untuk SIPENA Muhammadiyah."""
import hashlib, hmac, os, re, secrets, smtplib, socket, sqlite3, time
from datetime import date
from email.message import EmailMessage
from uuid import uuid4
from flask import Flask, g, jsonify, request, session, Response, send_file, send_from_directory
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from fpdf import FPDF
import seed

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.environ.get("DB", os.path.join(BASE, "tpq.db"))
app = Flask(__name__, static_folder=BASE, static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "ganti-rahasia-ini")
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
                  MAX_CONTENT_LENGTH=25 * 1024 * 1024)
MATERI_UPLOAD_DIR = os.path.join(app.instance_path, "uploads", "materi")
MATERI_EXTENSIONS = {".ppt", ".pptx"}
COVER_UPLOAD_DIR = os.path.join(app.instance_path, "uploads", "cover")
COVER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Pemetaan "kunci di tampilan:kolom di database" untuk tabel yang bentuknya sederhana
SPEC = {
    "t":  ("tugas",        "id:id j:judul k:kelas_id t:tanggal"),
    "mt": ("materi",       "id:id j:judul mp:mapel k:kelas_id i:isi"),
    "c":  ("capaian",      "id:id m:murid_id t:tanggal k:kelas_id j:jilid_juz h:halaman hs:hasil l:lulus s:surah bc:bisa_baca tl:bisa_tulis hg:bisa_hitung n:catatan"),
    "p":  ("pindah_kelas", "m:murid_id d:dari k:ke t:tanggal"),
    "a":  ("absensi",      "m:murid_id t:tanggal s:status"),
    "n":  ("nilai",        "m:murid_id t:tugas_id v:nilai"),
}
SPEC = {k: (t, [x.split(":") for x in cols.split()]) for k, (t, cols) in SPEC.items()}
FLAG, TEXT = {"l", "bc", "tl", "hg"}, {"hs", "s", "n"}


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def tutup(_):
    d = g.pop("db", None)
    if d: d.close()


def init():
    c = sqlite3.connect(DB)
    c.execute("PRAGMA foreign_keys=OFF")
    c.executescript(open(os.path.join(BASE, "schema.sql"), encoding="utf8").read())
    c.execute("PRAGMA foreign_keys=OFF")
    should_seed = (
        not c.execute("SELECT 1 FROM akun").fetchone()
        and not c.execute("SELECT 1 FROM murid").fetchone()
    )
    akun_columns = {row[1] for row in c.execute("PRAGMA table_info(akun)")}
    if "role" not in akun_columns:
        c.execute("ALTER TABLE akun ADD COLUMN role TEXT NOT NULL DEFAULT 'u'")
    if "nama" not in akun_columns:
        c.execute("ALTER TABLE akun ADD COLUMN nama TEXT NOT NULL DEFAULT 'Ustadzah'")
    if "google_email" not in akun_columns:
        c.execute("ALTER TABLE akun ADD COLUMN google_email TEXT")
    if "email" not in akun_columns:
        c.execute("ALTER TABLE akun ADD COLUMN email TEXT")
    c.execute("UPDATE akun SET email=google_email WHERE email IS NULL AND google_email IS NOT NULL")
    c.execute(
        "INSERT OR IGNORE INTO akun(username,password_hash,role,nama) VALUES('ustadzah',?,'u','Ustadzah')",
        (generate_password_hash(os.environ.get("ADMIN_PASSWORD", "admin123")),),
    )
    c.execute("UPDATE akun SET nama='Ustadzah' WHERE nama IS NULL OR trim(nama)=''")
    murid_columns = {row[1] for row in c.execute("PRAGMA table_info(murid)")}
    if "nomor_hp" not in murid_columns:
        c.execute("ALTER TABLE murid ADD COLUMN nomor_hp TEXT")
    if "ustadzah_id" not in murid_columns:
        c.execute("""CREATE TABLE murid_baru (
            id TEXT PRIMARY KEY,
            ustadzah_id TEXT NOT NULL REFERENCES akun(username),
            nama TEXT NOT NULL COLLATE NOCASE,
            no_absen INTEGER NOT NULL,
            kelas_id TEXT NOT NULL REFERENCES kelas(id),
            status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
            tgl_masuk TEXT,
            pass_awal TEXT,
            pass_hash TEXT,
            ganti_sandi INTEGER NOT NULL DEFAULT 0,
            nomor_hp TEXT,
            UNIQUE (ustadzah_id, nama))""")
        c.execute("""INSERT INTO murid_baru
            (id,ustadzah_id,nama,no_absen,kelas_id,status,tgl_masuk,pass_awal,pass_hash,ganti_sandi,nomor_hp)
            SELECT id,'ustadzah',nama,no_absen,kelas_id,status,tgl_masuk,pass_awal,pass_hash,ganti_sandi,nomor_hp
            FROM murid""")
        c.execute("DROP TABLE murid")
        c.execute("ALTER TABLE murid_baru RENAME TO murid")
    columns = {row[1] for row in c.execute("PRAGMA table_info(materi)")}
    if "file_name" not in columns:
        c.execute("ALTER TABLE materi ADD COLUMN file_name TEXT")
    if "file_path" not in columns:
        c.execute("ALTER TABLE materi ADD COLUMN file_path TEXT")
    for table in ("tugas", "materi", "soal_kuis"):
        columns = {row[1] for row in c.execute(f"PRAGMA table_info({table})")}
        if "ustadzah_id" not in columns:
            c.execute(
                f"ALTER TABLE {table} ADD COLUMN ustadzah_id TEXT NOT NULL DEFAULT 'ustadzah' "
                "REFERENCES akun(username)"
            )
    if not c.execute("SELECT 1 FROM akun WHERE username='admin'").fetchone():
        c.execute("INSERT INTO akun(username,password_hash,role,nama) VALUES('admin',?,'a','Admin')",
                  (generate_password_hash(os.environ.get("ADMIN_LOGIN_PASSWORD", "admin123")),))
    c.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_akun_email ON akun(email) WHERE email IS NOT NULL")
    c.execute("""CREATE TABLE IF NOT EXISTS email_login_codes (
        email TEXT PRIMARY KEY,
        code_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0
    )""")
    c.execute("CREATE INDEX IF NOT EXISTS idx_murid_ustadzah ON murid(ustadzah_id, no_absen)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tugas_ustadzah ON tugas(ustadzah_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_materi_ustadzah ON materi(ustadzah_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_soal_kuis_ustadzah ON soal_kuis(ustadzah_id)")
    if should_seed:
        seed.isi(c)
    c.commit()
    c.execute("PRAGMA foreign_keys=ON")
    c.close()


def need(role):
    def deco(f):
        def w(*a, **k):
            if session.get("me", {}).get("r") != role:
                return {"error": "Tidak diizinkan"}, 401
            return f(*a, **k)
        w.__name__ = f.__name__
        return w
    return deco


def baca(k, ustadzah_id=None):
    t, cols = SPEC[k]
    query = f"SELECT {','.join(c for _, c in cols)} FROM {t}"
    params = ()
    if ustadzah_id:
        if t in {"absensi", "capaian", "pindah_kelas", "nilai"}:
            query += " WHERE murid_id IN (SELECT id FROM murid WHERE ustadzah_id=?)"
        else:
            query += " WHERE ustadzah_id=?"
        params = (ustadzah_id,)
    query += " ORDER BY rowid"
    return [{a: r[i] for i, (a, _) in enumerate(cols)} for r in db().execute(query, params)]

def daftar_murid(ustadzah_id=None):
    query = "SELECT * FROM murid"
    params = ()
    if ustadzah_id:
        query += " WHERE ustadzah_id=?"
        params = (ustadzah_id,)
    return [{"id": r["id"], "nama": r["nama"], "no": r["no_absen"], "k": r["kelas_id"], "st": r["status"],
             "masuk": r["tgl_masuk"], "pass": r["pass_awal"], "gp": r["ganti_sandi"], "hp": r["nomor_hp"]}
            for r in db().execute(query + " ORDER BY no_absen", params)]

def daftar_soal(ustadzah_id=None):
    query = "SELECT * FROM soal_kuis"
    params = ()
    if ustadzah_id:
        query += " WHERE ustadzah_id=?"
        params = (ustadzah_id,)
    return [{"id": r["id"], "q": r["pertanyaan"], "o": [r["opsi1"], r["opsi2"], r["opsi3"], r["opsi4"]], "a": r["jawaban"]}
            for r in db().execute(query + " ORDER BY rowid", params)]


def current_teacher_id():
    return session.get("me", {}).get("id", "ustadzah")


def hash_login_code(email, code):
    key = app.secret_key.encode("utf-8")
    return hmac.new(key, f"{email}:{code}".encode("utf-8"), hashlib.sha256).hexdigest()


def kirim_kode_login(email, code):
    host = os.environ.get("SMTP_HOST", "").strip()
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", username).strip()
    try:
        port = int(os.environ.get("SMTP_PORT", "587"))
    except ValueError:
        return "Konfigurasi SMTP_PORT tidak valid.", 503
    if not 1 <= port <= 65535:
        return "Konfigurasi SMTP_PORT tidak valid.", 503
    if not host or not username or not password or not sender:
        return "Email belum dikonfigurasi. Pengelola perlu mengatur SMTP_HOST, SMTP_USERNAME, dan SMTP_PASSWORD.", 503

    message = EmailMessage()
    message["Subject"] = "Kode verifikasi login SIPENA"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Kode verifikasi login SIPENA Anda adalah {code}.\n"
        "Kode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun."
    )
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                server.login(username, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls()
                server.login(username, password)
                server.send_message(message)
    except (OSError, smtplib.SMTPException):
        app.logger.exception("Pengiriman kode login email gagal")
        return "Email kode verifikasi gagal dikirim. Periksa konfigurasi email lalu coba lagi.", 502
    return None, None


def username_dari_email(connection, email):
    base_username = re.sub(r"[^a-z0-9._-]+", "-", email.split("@", 1)[0].lower()).strip(".-_")
    base_username = (base_username or "ustadzah")[:24]
    username = base_username
    suffix = 1
    while connection.execute("SELECT 1 FROM akun WHERE username=?", (username,)).fetchone():
        username = f"{base_username[:24-len(str(suffix))-1]}-{suffix}"
        suffix += 1
    return username


@app.get("/")
def index():
    return send_from_directory(BASE, "login.html")


@app.get("/login")
def login_page():
    return send_from_directory(BASE, "login.html")


@app.post("/api/login")
def login():
    b = request.get_json(silent=True) or {}
    u, p = str(b.get("u", "")).strip().lower(), str(b.get("p", ""))
    selected_role = str(b.get("r", "")).strip()
    if selected_role and selected_role not in {"u", "w", "c", "a"}:
        return {"error": "Jenis akun tidak valid"}, 400
    a = db().execute("SELECT username,password_hash,role,nama FROM akun WHERE username=?", (u,)).fetchone()
    if a:
        if check_password_hash(a["password_hash"], p):
            if selected_role and selected_role != a["role"]:
                return {"error": "Jenis akun tidak sesuai dengan pilihan."}, 401
            session.clear()
            session["me"] = {"r": a["role"]}
            if a["role"] == "u":
                session["me"].update({"id": a["username"], "nama": a["nama"]})
            return {"ok": 1, "me": session["me"]}
    if selected_role in {"w", "c"}:
        teacher_id = str(b.get("teacher", "")).strip().lower()
        m = db().execute(
            "SELECT id,nama,ustadzah_id,kelas_id,pass_awal,pass_hash FROM murid "
            "WHERE lower(nama)=? AND ustadzah_id=? AND status='aktif'",
            (u, teacher_id),
        ).fetchone()
        if m and (check_password_hash(m["pass_hash"], p) if m["pass_hash"]
                  else secrets.compare_digest(str(m["pass_awal"] or ""), p)):
            session.clear()
            session["me"] = {
                "r": selected_role,
                "id": m["id"],
                "teacher_id": m["ustadzah_id"],
                **({"nama": m["nama"], "k": m["kelas_id"]} if selected_role == "c" else {}),
            }
            return {"ok": 1, "me": session["me"]}
    return {"error": "Login gagal"}, 401


@app.get("/api/ustadzah")
def daftar_ustadzah_publik():
    return jsonify(ustadzah=[{
        "id": row["username"],
        "nama": row["nama"],
    } for row in db().execute(
        "SELECT username,nama FROM akun WHERE role='u' ORDER BY lower(nama),username"
    )])


@app.post("/api/auth/register")
def daftar_akun_ustadzah():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return {"error": "Data pendaftaran tidak valid."}, 400

    display_name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower() or None
    username = str(body.get("username", "")).strip().lower()
    password = str(body.get("password", ""))
    if (not display_name or len(display_name) > 100
            or not re.fullmatch(r"[a-z0-9._]{3,24}", username)
            or len(password) < 8 or len(password) > 256):
        return {"error": "Nama, username, atau kata sandi tidak valid. Username 3-24 huruf, angka, atau titik; kata sandi minimal 8 karakter."}, 400
    if email and (
        len(email) > 254
        or not re.fullmatch(r"[^@\s]{1,64}@[^@\s.]+(?:\.[^@\s.]+)+", email)
    ):
        return {"error": "Alamat email tidak valid."}, 400

    with db() as connection:
        if connection.execute(
            "SELECT 1 FROM akun WHERE lower(username)=?", (username,)
        ).fetchone():
            return {"error": "Username sudah digunakan. Silakan pilih username lain."}, 409
        if email and connection.execute(
            "SELECT 1 FROM akun WHERE lower(email)=? OR lower(google_email)=?",
            (email, email),
        ).fetchone():
            return {"error": "Email sudah digunakan oleh akun lain."}, 409
        try:
            connection.execute(
                "INSERT INTO akun(username,password_hash,role,nama,email) "
                "VALUES(?,?,'u',?,?)",
                (username, generate_password_hash(password), display_name, email),
            )
        except sqlite3.IntegrityError:
            return {"error": "Username atau email sudah digunakan. Periksa kembali data Anda."}, 409

    return {"ok": 1, "username": username}, 201


@app.post("/api/auth/email/request-code")
def minta_kode_login_email():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return {"error": "Data email tidak valid."}, 400
    email = str(body.get("email", "")).strip().lower()
    if len(email) > 254 or not re.fullmatch(r"[^@\s]{1,64}@[^@\s.]+(?:\.[^@\s.]+)+", email):
        return {"error": "Masukkan alamat email yang valid."}, 400

    now = int(time.time())
    with db() as connection:
        connection.execute("DELETE FROM email_login_codes WHERE expires_at<=?", (now,))
    previous = db().execute(
        "SELECT created_at FROM email_login_codes WHERE email=?", (email,)
    ).fetchone()
    if previous and now - previous["created_at"] < 60:
        remaining = max(1, 60 - (now - previous["created_at"]))
        return {"error": f"Tunggu {remaining} detik sebelum meminta kode lagi."}, 429

    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = hash_login_code(email, code)
    with db() as connection:
        connection.execute(
            "INSERT INTO email_login_codes(email,code_hash,expires_at,created_at,attempts) "
            "VALUES(?,?,?,?,0) ON CONFLICT(email) DO UPDATE SET "
            "code_hash=excluded.code_hash,expires_at=excluded.expires_at,"
            "created_at=excluded.created_at,attempts=0",
            (email, code_hash, now + 600, now),
        )
    error, status = kirim_kode_login(email, code)
    if error:
        with db() as connection:
            connection.execute(
                "DELETE FROM email_login_codes WHERE email=? AND code_hash=?",
                (email, code_hash),
            )
        return {"error": error}, status
    return {"ok": 1, "message": "Kode verifikasi telah dikirim ke email Anda."}


@app.post("/api/auth/email/verify-code")
def verifikasi_kode_login_email():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return {"error": "Data verifikasi tidak valid."}, 400
    email = str(body.get("email", "")).strip().lower()
    code = str(body.get("code", "")).strip()
    display_name = str(body.get("name", "")).strip()
    if (len(email) > 254
            or not re.fullmatch(r"[^@\s]{1,64}@[^@\s.]+(?:\.[^@\s.]+)+", email)
            or not re.fullmatch(r"\d{6}", code)
            or not display_name
            or len(display_name) > 100):
        return {"error": "Nama, email, atau kode verifikasi tidak valid."}, 400

    record = db().execute(
        "SELECT code_hash,expires_at,attempts FROM email_login_codes WHERE email=?",
        (email,),
    ).fetchone()
    if not record:
        return {"error": "Kode tidak ditemukan. Minta kode verifikasi baru."}, 400
    if record["expires_at"] <= int(time.time()):
        with db() as connection:
            connection.execute("DELETE FROM email_login_codes WHERE email=?", (email,))
        return {"error": "Kode sudah kedaluwarsa. Minta kode verifikasi baru."}, 400
    if record["attempts"] >= 5:
        return {"error": "Batas percobaan kode tercapai. Minta kode verifikasi baru."}, 429
    if not hmac.compare_digest(record["code_hash"], hash_login_code(email, code)):
        with db() as connection:
            connection.execute(
                "UPDATE email_login_codes SET attempts=attempts+1 WHERE email=?",
                (email,),
            )
        return {"error": "Kode verifikasi salah. Periksa email lalu coba lagi."}, 401

    account = db().execute(
        "SELECT username,role,nama FROM akun WHERE lower(email)=? OR lower(google_email)=?",
        (email, email),
    ).fetchone()
    if account and account["role"] != "u":
        with db() as connection:
            connection.execute("DELETE FROM email_login_codes WHERE email=?", (email,))
        return {"error": "Email ini tidak terdaftar sebagai akun ustadzah."}, 403

    try:
        with db() as connection:
            if account:
                username = account["username"]
                display_name = account["nama"] or display_name
                connection.execute(
                    "UPDATE akun SET email=COALESCE(email,?) WHERE username=?",
                    (email, username),
                )
            else:
                username = username_dari_email(connection, email)
                connection.execute(
                    "INSERT INTO akun(username,password_hash,role,nama,email) "
                    "VALUES(?,?,'u',?,?)",
                    (username, generate_password_hash(secrets.token_urlsafe(32)),
                     display_name, email),
                )
            connection.execute("DELETE FROM email_login_codes WHERE email=?", (email,))
    except sqlite3.IntegrityError:
        app.logger.exception("Akun ustadzah gagal dibuat atau ditautkan melalui email")
        return {"error": "Akun dengan email ini tidak dapat digunakan. Hubungi pengelola."}, 409

    session.clear()
    session["me"] = {"r": "u", "id": username, "nama": display_name}
    return {"ok": 1, "me": session["me"], "created": account is None}


@app.post("/api/logout")
def logout():
    session.clear(); return {"ok": 1}


@app.get("/api/db")
def ambil():
    me = session.get("me")
    if not me: return {}, 401
    teacher_id = me.get("id", "ustadzah") if me["r"] == "u" else me.get("teacher_id")
    D = {k: baca(k, teacher_id) for k in SPEC}
    D["m"] = daftar_murid(teacher_id)
    D["q"] = daftar_soal(teacher_id)
    attachments = {
        row["id"]: row
        for row in db().execute("SELECT id,file_name FROM materi WHERE file_path IS NOT NULL")
    }
    for material in D["mt"]:
        attachment = attachments.get(material["id"])
        if attachment:
            material["fn"] = attachment["file_name"]
            material["file"] = f"/api/materi/{material['id']}/file"
    if me["r"] in {"w", "c"}:                # wali/anak: hanya data anaknya
        m = next((x for x in D["m"] if x["id"] == me["id"]), None)
        if not m:
            session.clear()
            message = "Akun anak tidak lagi aktif." if me["r"] == "c" else "Akun wali murid tidak lagi aktif."
            return {"error": message}, 401
        m.pop("pass", None)
        if me["r"] == "c":
            me.update({"nama": m["nama"], "k": m["k"]})
            D = {"m": [{key: m[key] for key in ("id", "nama", "no", "k", "st")}]}
        else:
            D = {"m": [m], "a": [x for x in D["a"] if x["m"] == m["id"]],
                 "mt": [x for x in D["mt"] if x["k"] == m["k"]],
                 "c": [x for x in D["c"] if x["m"] == m["id"]],
                 "p": [], "t": [], "n": [], "q": []}
    elif me["r"] == "a":
        for student in D["m"]:
            student.pop("pass", None)
    settings = baca_pengaturan()
    D["settings"] = settings
    return jsonify(me=me, db=D)


def baca_pengaturan():
    values = {row["kunci"]: row["nilai"] for row in db().execute("SELECT kunci,nilai FROM pengaturan")}
    return {
        "primary": values.get("warna_utama", "#8ecae6"),
        "secondary": values.get("warna_kedua", "#4076d1"),
        "cover": bool(values.get("foto_cover")),
    }


@app.get("/api/pengaturan")
def pengaturan_publik():
    return jsonify(baca_pengaturan())


@app.get("/api/admin/murid")
@need("a")
def admin_daftar_murid():
    records = db().execute(
        """SELECT id,nama,no_absen,kelas_id,status,nomor_hp,pass_hash,ganti_sandi
           FROM murid ORDER BY kelas_id,no_absen"""
    )
    return jsonify(murid=[{
        "id": row["id"],
        "nama": row["nama"],
        "no": row["no_absen"],
        "kelas": row["kelas_id"],
        "status": row["status"],
        "hp": row["nomor_hp"] or "",
        "password_status": (
            "Sandi sementara — perlu diberikan" if row["pass_hash"] and not row["ganti_sandi"]
            else "Sandi sudah diubah" if row["ganti_sandi"]
            else "Sandi awal aktif"
        ),
    } for row in records])


@app.post("/api/admin/murid/<student_id>/reset-password")
@need("a")
def admin_reset_sandi(student_id):
    temporary = secrets.token_urlsafe(9)
    with db() as connection:
        cursor = connection.execute(
            "UPDATE murid SET pass_awal=NULL,pass_hash=?,ganti_sandi=0 WHERE id=?",
            (generate_password_hash(temporary), student_id),
        )
        if cursor.rowcount != 1:
            return {"error": "Akun wali murid tidak ditemukan."}, 404
    return {"ok": 1, "temporary_password": temporary}


@app.post("/api/admin/pengaturan")
@need("a")
def admin_simpan_pengaturan():
    body = request.get_json(silent=True) or {}
    primary = str(body.get("primary", ""))
    secondary = str(body.get("secondary", ""))
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", primary) or not re.fullmatch(r"#[0-9a-fA-F]{6}", secondary):
        return {"error": "Pilih warna dengan format HEX yang valid."}, 400
    with db() as connection:
        connection.executemany(
            "INSERT INTO pengaturan(kunci,nilai) VALUES(?,?) ON CONFLICT(kunci) DO UPDATE SET nilai=excluded.nilai",
            (("warna_utama", primary.lower()), ("warna_kedua", secondary.lower())),
        )
    return {"ok": 1, **baca_pengaturan()}


@app.post("/api/admin/cover")
@need("a")
def admin_unggah_cover():
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return {"error": "Pilih foto untuk sampul terlebih dahulu."}, 400
    name = secure_filename(uploaded.filename)
    extension = os.path.splitext(name)[1].lower()
    if extension not in COVER_EXTENSIONS:
        return {"error": "Foto sampul harus berformat JPG, PNG, atau WEBP."}, 400

    stored_name = f"{uuid4().hex}{extension}"
    os.makedirs(COVER_UPLOAD_DIR, exist_ok=True)
    stored_path = os.path.join(COVER_UPLOAD_DIR, stored_name)
    try:
        uploaded.save(stored_path)
        size = os.path.getsize(stored_path)
        if size == 0 or size > 8 * 1024 * 1024:
            os.remove(stored_path)
            return {"error": "Ukuran foto harus lebih dari 0 byte dan maksimal 8 MB."}, 400
        with db() as connection:
            previous = connection.execute(
                "SELECT nilai FROM pengaturan WHERE kunci='foto_cover'"
            ).fetchone()
            connection.execute(
                "INSERT INTO pengaturan(kunci,nilai) VALUES('foto_cover',?) "
                "ON CONFLICT(kunci) DO UPDATE SET nilai=excluded.nilai",
                (stored_name,),
            )
        if previous and previous["nilai"]:
            old_path = os.path.join(COVER_UPLOAD_DIR, os.path.basename(previous["nilai"]))
            if os.path.isfile(old_path):
                os.remove(old_path)
    except OSError:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        app.logger.exception("Gagal menyimpan foto sampul")
        return {"error": "Foto sampul gagal disimpan. Coba lagi."}, 500
    except sqlite3.Error:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        app.logger.exception("Gagal menyimpan pengaturan foto sampul")
        return {"error": "Pengaturan foto sampul gagal disimpan. Coba lagi."}, 500
    return {"ok": 1}


@app.get("/api/cover")
def sampul_publik():
    cover = db().execute("SELECT nilai FROM pengaturan WHERE kunci='foto_cover'").fetchone()
    if not cover or not cover["nilai"]:
        return {"error": "Foto sampul belum diatur."}, 404
    name = os.path.basename(cover["nilai"])
    extension = os.path.splitext(name)[1].lower()
    if extension not in COVER_EXTENSIONS:
        app.logger.error("Format foto sampul tersimpan tidak valid")
        return {"error": "Foto sampul tidak dapat dibuka."}, 500
    path = os.path.join(COVER_UPLOAD_DIR, name)
    if not os.path.isfile(path):
        return {"error": "Foto sampul tidak ditemukan."}, 404
    return send_file(path, mimetype={
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }[extension], max_age=300)


@app.post("/api/materi/upload")
@need("u")
def unggah_materi():
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return {"error": "Pilih file PowerPoint yang ingin diunggah."}, 400

    original_name = secure_filename(uploaded.filename)
    extension = os.path.splitext(original_name)[1].lower()
    if extension not in MATERI_EXTENSIONS:
        return {"error": "Format file harus PowerPoint .ppt atau .pptx."}, 400

    title = str(request.form.get("judul", "")).strip() or os.path.splitext(original_name)[0]
    subject = str(request.form.get("mapel", "")).strip() or "Materi PPT"
    class_id = str(request.form.get("kelas", "")).strip()
    description = str(request.form.get("isi", "")).strip()
    if not title or len(title) > 150 or len(subject) > 80 or len(description) > 2000:
        return {"error": "Judul, mata pelajaran, atau deskripsi terlalu panjang."}, 400
    if class_id not in {"sore", "malam"}:
        return {"error": "Pilih kelas yang valid."}, 400

    material_id = f"materi-{uuid4().hex}"
    stored_name = f"{uuid4().hex}{extension}"
    os.makedirs(MATERI_UPLOAD_DIR, exist_ok=True)
    stored_path = os.path.join(MATERI_UPLOAD_DIR, stored_name)
    try:
        uploaded.save(stored_path)
        with db() as connection:
            connection.execute(
                "INSERT INTO materi(id,ustadzah_id,judul,mapel,kelas_id,isi,file_name,file_path) "
                "VALUES(?,?,?,?,?,?,?,?)",
                (material_id, current_teacher_id(), title, subject, class_id, description, original_name, stored_name),
            )
    except OSError:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        app.logger.exception("Gagal menyimpan file materi PowerPoint")
        return {"error": "File materi gagal disimpan. Coba lagi."}, 500
    except sqlite3.Error:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        app.logger.exception("Gagal menyimpan data materi PowerPoint")
        return {"error": "Data materi gagal disimpan. Coba lagi."}, 500

    return {"ok": 1, "id": material_id, "file": f"/api/materi/{material_id}/file"}, 201


@app.get("/api/materi/<material_id>/file")
def unduh_materi(material_id):
    me = session.get("me")
    if not me:
        return {"error": "Silakan masuk terlebih dahulu."}, 401

    material = db().execute(
        "SELECT id,ustadzah_id,kelas_id,file_name,file_path FROM materi WHERE id=?",
        (material_id,),
    ).fetchone()
    if not material or not material["file_path"]:
        return {"error": "File materi tidak ditemukan."}, 404
    teacher_id = me.get("id") if me["r"] == "u" else me.get("teacher_id")
    if material["ustadzah_id"] != teacher_id:
        return {"error": "Tidak diizinkan."}, 403
    if me["r"] == "w":
        child = db().execute("SELECT kelas_id FROM murid WHERE id=?", (me["id"],)).fetchone()
        if not child or child["kelas_id"] != material["kelas_id"]:
            return {"error": "Tidak diizinkan."}, 403
    elif me["r"] != "u":
        return {"error": "Tidak diizinkan."}, 403

    path = os.path.join(MATERI_UPLOAD_DIR, os.path.basename(material["file_path"]))
    if not os.path.isfile(path):
        return {"error": "File materi tidak ditemukan di penyimpanan."}, 404
    return send_file(path, as_attachment=True, download_name=material["file_name"])


@app.errorhandler(RequestEntityTooLarge)
def ukuran_materi_terlalu_besar(_error):
    return {"error": "Ukuran file maksimal 25 MB."}, 413


def norm(key, v):
    if key in FLAG: return 1 if v else 0
    if key in TEXT: return v or ""
    return v

@app.put("/api/db")
@need("u")
def simpan():
    b = request.get_json(silent=True) or {}
    if not all(isinstance(b.get(k), list) for k in [*SPEC, "m", "q"]):
        return {"error": "Data tidak valid"}, 400
    if any(not isinstance(item, dict) for key in [*SPEC, "m", "q"] for item in b[key]):
        return {"error": "Setiap baris data harus berbentuk objek yang valid."}, 400
    c = db()
    teacher_id = current_teacher_id()
    lama = {r["id"]: r for r in c.execute(
        "SELECT id,pass_awal,pass_hash,ganti_sandi FROM murid WHERE ustadzah_id=?",
        (teacher_id,),
    )}
    submitted_ids = [str(m.get("id", "")) for m in b["m"]]
    task_ids = [str(task.get("id", "")) for task in b["t"]]
    if (any(not value for value in submitted_ids + task_ids)
            or len(set(submitted_ids)) != len(submitted_ids)
            or len(set(task_ids)) != len(task_ids)):
        return {"error": "Setiap murid dan tugas harus memiliki ID yang unik."}, 400
    if submitted_ids:
        placeholders = ",".join("?" * len(submitted_ids))
        existing_students = c.execute(
            f"SELECT id,ustadzah_id FROM murid WHERE id IN ({placeholders})",
            submitted_ids,
        )
        if any(row["ustadzah_id"] != teacher_id for row in existing_students):
            return {"error": "Data murid tidak valid untuk akun ustadzah ini."}, 400
    if task_ids:
        placeholders = ",".join("?" * len(task_ids))
        existing_tasks = c.execute(
            f"SELECT id,ustadzah_id FROM tugas WHERE id IN ({placeholders})",
            task_ids,
        )
        if any(row["ustadzah_id"] != teacher_id for row in existing_tasks):
            return {"error": "Data tugas tidak valid untuk akun ustadzah ini."}, 400
    for key, table in (("mt", "materi"), ("q", "soal_kuis")):
        record_ids = [str(record.get("id", "")) for record in b[key]]
        if any(not record_id for record_id in record_ids) or len(set(record_ids)) != len(record_ids):
            return {"error": "Setiap materi dan soal harus memiliki ID yang unik."}, 400
        if record_ids:
            placeholders = ",".join("?" * len(record_ids))
            foreign_records = c.execute(
                f"SELECT id FROM {table} WHERE id IN ({placeholders}) AND ustadzah_id<>?",
                (*record_ids, teacher_id),
            )
            if foreign_records.fetchone():
                return {"error": "Data materi atau soal tidak valid untuk akun ustadzah ini."}, 400
    achievement_ids = [str(record.get("id", "")) for record in b["c"]]
    if any(not record_id for record_id in achievement_ids) or len(set(achievement_ids)) != len(achievement_ids):
        return {"error": "Setiap capaian harus memiliki ID yang unik."}, 400
    if achievement_ids:
        placeholders = ",".join("?" * len(achievement_ids))
        foreign_achievements = c.execute(
            f"SELECT c.id FROM capaian c JOIN murid m ON m.id=c.murid_id "
            f"WHERE c.id IN ({placeholders}) AND m.ustadzah_id<>?",
            (*achievement_ids, teacher_id),
        )
        if foreign_achievements.fetchone():
            return {"error": "Data capaian tidak valid untuk akun ustadzah ini."}, 400
    student_ids = set(submitted_ids)
    if any(str(record.get("m", "")) not in student_ids for key in ("a", "c", "p", "n") for record in b[key]):
        return {"error": "Data absensi, capaian, pindah kelas, atau nilai memuat murid yang tidak terdaftar."}, 400
    submitted_task_ids = set(task_ids)
    if any(str(record.get("t", "")) not in submitted_task_ids for record in b["n"]):
        return {"error": "Nilai harus terhubung ke tugas milik ustadzah ini."}, 400
    file_materi = {
        r["id"]: (r["file_name"], r["file_path"])
        for r in c.execute(
            "SELECT id,file_name,file_path FROM materi WHERE file_path IS NOT NULL AND ustadzah_id=?",
            (teacher_id,),
        )
    }
    try:
        with c:                                # satu transaksi: gagal = batal semua
            for table in ("nilai", "absensi", "capaian", "pindah_kelas"):
                c.execute(
                    f"DELETE FROM {table} WHERE murid_id IN "
                    "(SELECT id FROM murid WHERE ustadzah_id=?)",
                    (teacher_id,),
                )
            c.execute(
                "DELETE FROM nilai WHERE tugas_id IN (SELECT id FROM tugas WHERE ustadzah_id=?)",
                (teacher_id,),
            )
            for table in ("tugas", "materi", "soal_kuis"):
                c.execute(f"DELETE FROM {table} WHERE ustadzah_id=?", (teacher_id,))
            if submitted_ids:
                placeholders = ",".join("?" * len(submitted_ids))
                c.execute(
                    f"DELETE FROM murid WHERE ustadzah_id=? AND id NOT IN ({placeholders})",
                    (teacher_id, *submitted_ids),
                )
            else:
                c.execute("DELETE FROM murid WHERE ustadzah_id=?", (teacher_id,))
            for m in b["m"]:                   # sandi diatur server, bukan tampilan
                o = lama.get(m["id"])
                if not o or m.get("reset") or (not o["pass_hash"] and not o["ganti_sandi"]):
                    pa, ph, gs = str(m["no"]), None, 0
                else:
                    pa, ph, gs = o["pass_awal"], o["pass_hash"], o["ganti_sandi"]
                c.execute("""INSERT INTO murid(id,ustadzah_id,nama,no_absen,kelas_id,status,tgl_masuk,pass_awal,pass_hash,ganti_sandi,nomor_hp)
                             VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET nama=excluded.nama,
                             no_absen=excluded.no_absen,kelas_id=excluded.kelas_id,status=excluded.status,
                             tgl_masuk=excluded.tgl_masuk,pass_awal=excluded.pass_awal,
                             pass_hash=excluded.pass_hash,ganti_sandi=excluded.ganti_sandi,nomor_hp=excluded.nomor_hp""",
                          (m["id"], teacher_id, m["nama"], int(m["no"]), m["k"], m["st"], m.get("masuk"), pa, ph, gs, m.get("hp")))
            for q in b["q"]:
                c.execute("INSERT INTO soal_kuis VALUES(?,?,?,?,?,?,?,?)",
                          (q["id"], teacher_id, q["q"], *q["o"], int(q["a"])))
            for k in ("t", "mt", "c", "p", "a", "n"):
                t, cols = SPEC[k]
                insert_cols = cols
                if k in {"t", "mt"}:
                    insert_cols = [("owner", "ustadzah_id"), *cols]
                if k == "mt":
                    insert_cols = [*insert_cols, ("fn", "file_name"), ("fp", "file_path")]
                sql = f"INSERT OR REPLACE INTO {t}({','.join(col for _, col in insert_cols)}) VALUES({','.join('?' * len(insert_cols))})"
                for r in b[k]:
                    values = [norm(a, r.get(a)) for a, _ in cols]
                    if k in {"t", "mt"}:
                        values.insert(0, teacher_id)
                    if k == "mt":
                        values.extend(file_materi.get(r.get("id"), (None, None)))
                    c.execute(sql, values)
    except (sqlite3.Error, KeyError, ValueError, TypeError):
        app.logger.exception("Data ustadzah gagal disimpan")
        return {"error": "Data ditolak: ada isian yang tidak valid"}, 400
    return {"ok": 1}


@app.post("/api/ganti-sandi")
@need("w")
def ganti_sandi():
    p = str((request.get_json(silent=True) or {}).get("p", ""))
    if len(p) < 4: return {"error": "Minimal 4 karakter"}, 400
    with db() as c:
        c.execute("UPDATE murid SET pass_hash=?,ganti_sandi=1,pass_awal=NULL WHERE id=?",
                  (generate_password_hash(p), session["me"]["id"]))
    return {"ok": 1}


@app.get("/api/akun.pdf")
@need("u")
def akun_pdf():
    pdf = FPDF(); pdf.add_page(); pdf.set_font("Helvetica", size=14)
    pdf.cell(0, 10, "Daftar Akun Wali Murid - SIPENA Muhammadiyah", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=11)
    for m in daftar_murid(current_teacher_id()):
        sandi = "(sudah diganti)" if m["gp"] else m["pass"]
        teks = f"{m['no']}. {m['nama']}  |  kata sandi awal: {sandi}"
        pdf.cell(0, 8, teks.encode("latin-1", "replace").decode("latin-1"), new_x="LMARGIN", new_y="NEXT")
    return Response(bytes(pdf.output()), mimetype="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=akun-wali-murid.pdf"})


@app.post("/api/reset")
@need("u")
def reset():
    teacher_id = current_teacher_id()
    c = db()
    try:
        with c:
            for table in ("nilai", "absensi", "capaian", "pindah_kelas"):
                c.execute(
                    f"DELETE FROM {table} WHERE murid_id IN "
                    "(SELECT id FROM murid WHERE ustadzah_id=?)",
                    (teacher_id,),
                )
            c.execute(
                "DELETE FROM nilai WHERE tugas_id IN (SELECT id FROM tugas WHERE ustadzah_id=?)",
                (teacher_id,),
            )
            for table in ("tugas", "materi", "soal_kuis"):
                c.execute(f"DELETE FROM {table} WHERE ustadzah_id=?", (teacher_id,))
            c.execute("DELETE FROM murid WHERE ustadzah_id=?", (teacher_id,))
            seed.isi(c, teacher_id)
    except sqlite3.Error:
        app.logger.exception("Gagal mengembalikan data contoh ustadzah")
        return {"error": "Data contoh gagal dikembalikan. Coba lagi."}, 500
    return {"ok": 1}


init()
if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    print(f"\nBuka di komputer ini: http://localhost:{port}/login.html", flush=True)
    if host == "0.0.0.0":
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as network_socket:
                network_socket.connect(("8.8.8.8", 80))
                local_ip = network_socket.getsockname()[0]
            print(
                f"Buka di HP yang tersambung ke Wi-Fi yang sama: "
                f"http://{local_ip}:{port}/login.html\n",
                flush=True,
            )
        except OSError as error:
            print(
                f"Tidak dapat mendeteksi alamat Wi-Fi komputer: {error}. "
                "Pastikan komputer tersambung ke Wi-Fi yang sama dengan HP.\n",
                flush=True,
            )
    app.run(host='0.0.0.0', port=5000, debug=True)