/* Halaman admin Tebak Kartu — tambah, ubah, hapus, cadangkan soal */
(function () {
  'use strict';
  const CFG = Object.assign({}, window.TEBAK_KARTU_CONFIG || {});
  const Store = window.TKStore;
  const $ = (s) => document.querySelector(s);
  const NAMA = { sore: 'Sore', malam: 'Malam', semua: 'Keduanya' };
  let semua = [];

  function toast(teks, galat) {
    const t = $('#toast');
    t.textContent = teks; t.className = 'toast' + (galat ? ' galat' : ''); t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200);
  }

  async function muat() {
    try { semua = await Store.list(); }
    catch (e) { toast('Soal belum bisa dimuat: ' + e.message, true); semua = []; }
    gambar();
  }

  function gambar() {
    const kata = $('#cari').value.trim().toLowerCase(), kelas = $('#saring').value;
    const tampil = semua.filter((q) =>
      (!kelas || q.kelas === kelas) &&
      (!kata || (q.pertanyaan + ' ' + q.kategori + ' ' + q.jawaban).toLowerCase().indexOf(kata) >= 0));
    $('#jumlah').textContent = '(' + tampil.length + ' dari ' + semua.length + ')';
    const tb = $('#isi-tabel'); tb.replaceChildren();
    tampil.forEach((q) => {
      const tr = document.createElement('tr');

      const tdK = document.createElement('td');
      const lb = document.createElement('span'); lb.className = 'lencana ' + q.kelas; lb.textContent = NAMA[q.kelas];
      tdK.appendChild(lb);

      const tdS = document.createElement('td');
      if (q.visual) { const v = document.createElement('span'); v.className = 'vis'; v.textContent = q.visual; tdS.appendChild(v); }
      const p = document.createElement('div'); p.textContent = q.pertanyaan; p.style.fontWeight = '700';
      const kat = document.createElement('small'); kat.textContent = (q.kategori || 'Tanpa kategori') + (q.pilihan.length ? ' · pilihan ganda' : ' · jawab lisan');
      tdS.appendChild(p); tdS.appendChild(kat);

      const tdJ = document.createElement('td'); tdJ.textContent = q.jawaban;

      const tdA = document.createElement('td');
      const box = document.createElement('div'); box.className = 'aksi-baris';
      const ub = document.createElement('button'); ub.type = 'button'; ub.className = 'tombol sekunder kecil'; ub.textContent = 'Ubah';
      ub.addEventListener('click', () => isiForm(q));
      const hp = document.createElement('button'); hp.type = 'button'; hp.className = 'tombol bahaya kecil'; hp.textContent = 'Hapus';
      hp.addEventListener('click', () => hapus(q));
      box.appendChild(ub); box.appendChild(hp); tdA.appendChild(box);

      tr.appendChild(tdK); tr.appendChild(tdS); tr.appendChild(tdJ); tr.appendChild(tdA);
      tb.appendChild(tr);
    });
    $('#kosong').hidden = tampil.length > 0;
  }

  function kosongkanForm() {
    ['#f-id', '#f-kategori', '#f-visual', '#f-tanya', '#f-jawab', '#f-salah', '#f-jelas'].forEach((s) => { $(s).value = ''; });
    $('#judul-form').textContent = 'Tambah soal';
    $('#btn-simpan').textContent = 'Simpan soal';
    $('#btn-batal').hidden = true;
  }

  function isiForm(q) {
    $('#f-id').value = q.id; $('#f-kelas').value = q.kelas; $('#f-kategori').value = q.kategori;
    $('#f-visual').value = q.visual; $('#f-tanya').value = q.pertanyaan; $('#f-jawab').value = q.jawaban;
    $('#f-salah').value = q.pilihan.filter((p) => p.toLowerCase() !== q.jawaban.toLowerCase()).join('\n');
    $('#f-jelas').value = q.penjelasan;
    $('#judul-form').textContent = 'Ubah soal';
    $('#btn-simpan').textContent = 'Simpan perubahan';
    $('#btn-batal').hidden = false;
    $('#f-tanya').focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function simpan() {
    const salah = $('#f-salah').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const jawab = $('#f-jawab').value.trim();
    if (!$('#f-tanya').value.trim()) { toast('Pertanyaan belum diisi.', true); $('#f-tanya').focus(); return; }
    if (!jawab) { toast('Jawaban yang benar belum diisi.', true); $('#f-jawab').focus(); return; }
    if (salah.length === 1) { toast('Isi minimal 2 pilihan yang salah, atau kosongkan semuanya untuk jawab lisan.', true); $('#f-salah').focus(); return; }
    const q = {
      id: $('#f-id').value, kelas: $('#f-kelas').value, kategori: $('#f-kategori').value, visual: $('#f-visual').value,
      pertanyaan: $('#f-tanya').value, jawaban: jawab, pilihan: salah.length ? [jawab].concat(salah) : [], penjelasan: $('#f-jelas').value
    };
    try {
      await Store.simpan(q);
      toast(q.id ? 'Soal diperbarui.' : 'Soal ditambahkan.');
      kosongkanForm(); await muat();
    } catch (e) { toast(e.message, true); }
  }

  async function hapus(q) {
    if (!confirm('Hapus soal ini?\n\n' + q.pertanyaan)) return;
    try { await Store.hapus(q.id); toast('Soal dihapus.'); await muat(); }
    catch (e) { toast('Gagal menghapus: ' + e.message, true); }
  }

  async function ekspor() {
    try {
      const data = await Store.ekspor();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'soal-tebak-kartu-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { toast('Gagal mengunduh: ' + e.message, true); }
  }

  async function impor(file) {
    try {
      const arr = JSON.parse(await file.text());
      if (!Array.isArray(arr)) throw new Error('Isi file harus berupa daftar soal.');
      const n = await Store.impor(arr);
      toast(n + ' soal ditambahkan dari file.'); await muat();
    } catch (e) { toast('File tidak bisa dibaca: ' + e.message, true); }
  }

  $('#info-mode').textContent = CFG.mode === 'api' ? '· tersimpan di server' : '· tersimpan di browser ini';
  $('#btn-kembali').href = 'index.html';
  $('#btn-simpan').addEventListener('click', simpan);
  $('#btn-batal').addEventListener('click', kosongkanForm);
  $('#cari').addEventListener('input', gambar);
  $('#saring').addEventListener('change', gambar);
  $('#btn-ekspor').addEventListener('click', ekspor);
  $('#btn-impor').addEventListener('click', () => $('#berkas').click());
  $('#berkas').addEventListener('change', (e) => { if (e.target.files[0]) impor(e.target.files[0]); e.target.value = ''; });
  $('#btn-contoh').addEventListener('click', async () => {
    if (!confirm('Semua soal sekarang akan diganti dengan soal contoh. Lanjutkan?')) return;
    try { await Store.kembalikanContoh(); toast('Soal contoh dikembalikan.'); await muat(); }
    catch (e) { toast(e.message, true); }
  });
  muat();
})();
