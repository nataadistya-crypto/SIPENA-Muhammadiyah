"""
API soal Tebak Kartu (Flask + SQLite bawaan Python, tanpa library tambahan).

Cara pasang di aplikasi Flask Anda:

    from backend.tebak_kartu_api import bp as tebak_kartu_bp, init_db
    app.register_blueprint(tebak_kartu_bp)
    init_db()

Lalu di tebak-kartu/js/config.js ubah  mode: 'api'.

PENTING: sesuaikan fungsi `boleh_akses()` dengan sistem login Anda.
Sesuai aturan bisnis AB-06 dan AB-07, hanya ustadzah yang boleh membuka game
dan mengubah soal.
"""
import json
import os
import sqlite3
import uuid

from flask import Blueprint, jsonify, request, session

bp = Blueprint("tebak_kartu_api", __name__, url_prefix="/api/tebak-kartu")
DB_PATH = os.environ.get("TEBAK_KARTU_DB", "tebak_kartu.db")
KELAS_SAH = ("sore", "malam", "semua")


def boleh_akses():
    """Ganti dengan pengecekan peran milik aplikasi Anda."""
    return session.get("role") == "ustadzah"


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS tebak_kartu_soal (
                id TEXT PRIMARY KEY,
                kelas TEXT NOT NULL,
                kategori TEXT DEFAULT '',
                visual TEXT DEFAULT '',
                pertanyaan TEXT NOT NULL,
                jawaban TEXT NOT NULL,
                pilihan TEXT DEFAULT '[]',
                penjelasan TEXT DEFAULT ''
            )"""
        )


def baris_ke_dict(r):
    d = dict(r)
    d["pilihan"] = json.loads(d.get("pilihan") or "[]")
    return d


def bersihkan(data):
    """Validasi masukan dari klien. Mengembalikan (dict, pesan_galat)."""
    pertanyaan = str(data.get("pertanyaan", "")).strip()
    jawaban = str(data.get("jawaban", "")).strip()
    kelas = data.get("kelas")
    if not pertanyaan or not jawaban:
        return None, "Pertanyaan dan jawaban wajib diisi."
    if kelas not in KELAS_SAH:
        return None, "Kelas harus sore, malam, atau semua."
    pilihan = [str(p).strip() for p in (data.get("pilihan") or []) if str(p).strip()]
    if pilihan and jawaban.lower() not in [p.lower() for p in pilihan]:
        pilihan.insert(0, jawaban)
    if len(pilihan) < 2:
        pilihan = []
    return {
        "kelas": kelas,
        "kategori": str(data.get("kategori", "")).strip()[:40],
        "visual": str(data.get("visual", "")).strip()[:30],
        "pertanyaan": pertanyaan[:300],
        "jawaban": jawaban[:120],
        "pilihan": json.dumps(pilihan[:8], ensure_ascii=False),
        "penjelasan": str(data.get("penjelasan", "")).strip()[:200],
    }, None


@bp.before_request
def jaga_akses():
    if not boleh_akses():
        return jsonify(error="Hanya ustadzah yang boleh mengakses."), 403


@bp.get("/soal")
def daftar():
    kelas = request.args.get("kelas")
    with db() as c:
        if kelas in ("sore", "malam"):
            rows = c.execute(
                "SELECT * FROM tebak_kartu_soal WHERE kelas IN (?, 'semua')", (kelas,)
            ).fetchall()
        else:
            rows = c.execute("SELECT * FROM tebak_kartu_soal").fetchall()
    return jsonify([baris_ke_dict(r) for r in rows])


@bp.post("/soal")
def tambah():
    data, galat = bersihkan(request.get_json(silent=True) or {})
    if galat:
        return jsonify(error=galat), 400
    data["id"] = uuid.uuid4().hex[:12]
    with db() as c:
        c.execute(
            "INSERT INTO tebak_kartu_soal (id,kelas,kategori,visual,pertanyaan,jawaban,pilihan,penjelasan)"
            " VALUES (:id,:kelas,:kategori,:visual,:pertanyaan,:jawaban,:pilihan,:penjelasan)",
            data,
        )
    data["pilihan"] = json.loads(data["pilihan"])
    return jsonify(data), 201


@bp.put("/soal/<soal_id>")
def ubah(soal_id):
    data, galat = bersihkan(request.get_json(silent=True) or {})
    if galat:
        return jsonify(error=galat), 400
    data["id"] = soal_id
    with db() as c:
        cur = c.execute(
            "UPDATE tebak_kartu_soal SET kelas=:kelas, kategori=:kategori, visual=:visual,"
            " pertanyaan=:pertanyaan, jawaban=:jawaban, pilihan=:pilihan, penjelasan=:penjelasan"
            " WHERE id=:id",
            data,
        )
    if cur.rowcount == 0:
        return jsonify(error="Soal tidak ditemukan."), 404
    data["pilihan"] = json.loads(data["pilihan"])
    return jsonify(data)


@bp.delete("/soal/<soal_id>")
def hapus(soal_id):
    with db() as c:
        cur = c.execute("DELETE FROM tebak_kartu_soal WHERE id=?", (soal_id,))
    if cur.rowcount == 0:
        return jsonify(error="Soal tidak ditemukan."), 404
    return "", 204
