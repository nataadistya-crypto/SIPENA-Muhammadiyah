/* Tebak Kartu — logika permainan
 * Alur: pilih kelas → kartu terbaring di meja → pilih satu → jawab →
 * kartu dipakai lalu diganti kartu baru dari tumpukan → semua kartu dikocok lagi.
 */
(function () {
  'use strict';
  const CFG = Object.assign({ backUrl: '../index.html', adminUrl: 'admin.html' }, window.TEBAK_KARTU_CONFIG || {});
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const Snd = window.TKSound, Store = window.TKStore;
  const kurangGerak = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

  const TEMA = {
    sore: {
      nama: 'Kelas Sore', poinDasar: 10, jumlahPilihan: 3,
      sambutan: 'Pilih satu kartu, jawab pertanyaannya, dan kumpulkan bintang!',
      ikon: ['⭐', '🌈', '🎈', '🍀', '🦋', '🌸', '🐣', '🍭'],
      warna: ['#ff4f8b', '#ffb800', '#27b6ff', '#1fb36b', '#8a5cf6']
    },
    malam: {
      nama: 'Kelas Malam', poinDasar: 15, jumlahPilihan: 4,
      sambutan: 'Buka kartunya, uji hafalan dan pemahamanmu.',
      ikon: ['✨', '🌙', '📖', '🪔', '💎', '🧭', '🕌', '🌟'],
      warna: ['#f2c14e', '#2bb596', '#7fb2ff', '#ffe9a8', '#ffffff']
    }
  };

  const S = {
    kelas: 'sore', deck: [], total: 0, skor: 0, beruntun: 0, benar: 0, salah: 0,
    terjawab: 0, nomor: 0, aktif: null, kunci: false, sudahJawab: false
  };

  const acak = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  const norm = (s) => String(s).trim().toLowerCase();
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const meja = $('#meja');

  function simpanLokal(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* abaikan */ } }
  function bacaLokal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- Layar dan kelas ---------- */
  function tampilLayar(nama) {
    $$('.layar').forEach((l) => l.classList.toggle('aktif', l.id === 'layar-' + nama));
    window.scrollTo(0, 0);
  }

  function pilihKelas(k) {
    if (!TEMA[k]) k = 'sore';
    S.kelas = k;
    document.body.dataset.kelas = k;
    $$('.pilih-kelas button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.kelas === k)));
    $('#label-kelas').textContent = TEMA[k].nama;
    $('#sambutan-teks').textContent = TEMA[k].sambutan;
    simpanLokal('tk_kelas', k);
    const r = bacaLokal('tk_rekor_' + k);
    $('#rekor').textContent = r ? 'Rekor ' + TEMA[k].nama + ': ' + r + ' poin' : '';
  }

  /* ---------- Kartu ---------- */
  function buatKartu(q) {
    S.nomor++;
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'kartu';
    el.setAttribute('aria-label', 'Kartu nomor ' + S.nomor);
    const isi = document.createElement('span'); isi.className = 'kartu-isi';
    const bel = document.createElement('span'); bel.className = 'muka belakang';
    const no = document.createElement('span'); no.className = 'no';
    const noIsi = document.createElement('span'); noIsi.textContent = S.nomor; no.appendChild(noIsi);
    const ik = document.createElement('span'); ik.className = 'ikon-kartu'; ik.textContent = sample(TEMA[S.kelas].ikon);
    bel.appendChild(no); bel.appendChild(ik);
    const dep = document.createElement('span'); dep.className = 'muka depan'; dep.textContent = '❓';
    isi.appendChild(bel); isi.appendChild(dep); el.appendChild(isi);
    el._q = q;
    el.addEventListener('click', () => bukaKartu(el));
    return el;
  }

  function tambahKartu(q, urutan) {
    const el = buatKartu(q);
    el.classList.add('muncul');
    el.style.animationDelay = (urutan * 55) + 'ms';
    el.addEventListener('animationend', () => { el.classList.remove('muncul'); el.style.animationDelay = ''; }, { once: true });
    meja.appendChild(el);
  }

  function bukaKartu(el) {
    if (S.kunci || S.aktif) return;
    S.aktif = { el: el, q: el._q };
    S.kunci = true;
    Snd.balik();
    el.classList.add('dibuka');
    setTimeout(() => { tampilModal(el._q); S.kunci = false; }, kurangGerak ? 0 : 480);
  }

  /* Kocok: kartu terbang ke tengah, lalu mendarat di posisi baru (teknik FLIP) */
  function kocok() {
    return new Promise((selesai) => {
      const els = $$('.kartu', meja);
      if (els.length < 2) { selesai(); return; }
      Snd.acak();
      const awal = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
      let baru = acak(els);
      for (let i = 0; i < 5 && els.length > 2 && baru.every((e, k) => e === els[k]); i++) baru = acak(els);
      baru.forEach((e) => meja.appendChild(e));
      if (kurangGerak) { selesai(); return; }
      const mr = meja.getBoundingClientRect();
      const cx = mr.left + mr.width / 2, cy = mr.top + mr.height / 2;
      const dur = 950;
      els.forEach((e, i) => {
        const a = awal.get(e), b = e.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        const tx = (cx - (b.left + b.width / 2)) * 0.6 + (Math.random() - 0.5) * 80;
        const ty = (cy - (b.top + b.height / 2)) * 0.6 + (Math.random() - 0.5) * 60;
        e.animate([
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(0deg)' },
          { transform: 'translate(' + tx + 'px,' + ty + 'px) rotate(' + ((Math.random() - 0.5) * 50) + 'deg) scale(.82)', offset: 0.45 },
          { transform: 'translate(0,0) rotate(0deg)' }
        ], { duration: dur, delay: i * 18, easing: 'cubic-bezier(.4,.1,.3,1)' });
      });
      setTimeout(selesai, dur + els.length * 18 + 40);
    });
  }

  /* ---------- Jendela pertanyaan ---------- */
  function tampilModal(q) {
    S.sudahJawab = false;
    const m = $('#modal'), kb = $('#kartu-besar');
    $('#m-kategori').textContent = q.kategori || 'Pertanyaan';
    const vis = $('#m-visual');
    if (q.visual) {
      vis.textContent = q.visual; vis.hidden = false;
      vis.classList.toggle('arab', /[\u0600-\u06FF]/.test(q.visual));
    } else { vis.hidden = true; vis.textContent = ''; }
    $('#m-tanya').textContent = q.pertanyaan;
    $('#m-umpan').hidden = true; $('#m-umpan').replaceChildren();
    $('#m-lanjut').hidden = true;
    const area = $('#m-jawab'); area.replaceChildren();

    if (q.pilihan && q.pilihan.length >= 2) {
      const salah = acak(q.pilihan.filter((p) => norm(p) !== norm(q.jawaban))).slice(0, TEMA[S.kelas].jumlahPilihan - 1);
      acak([q.jawaban].concat(salah)).forEach((teks) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'opsi'; b.textContent = teks;
        b.addEventListener('click', () => jawabPilihan(b, teks, q));
        area.appendChild(b);
      });
    } else {
      // Tanpa pilihan: anak menjawab lisan, ustadzah menilai
      const lihat = document.createElement('button');
      lihat.type = 'button'; lihat.className = 'opsi'; lihat.textContent = 'Lihat jawaban';
      lihat.addEventListener('click', () => {
        Snd.klik();
        area.replaceChildren();
        const kunci = document.createElement('div'); kunci.className = 'kunci-jawaban'; kunci.textContent = q.jawaban;
        const ya = document.createElement('button'); ya.type = 'button'; ya.className = 'opsi'; ya.textContent = '✔ Benar';
        const tidak = document.createElement('button'); tidak.type = 'button'; tidak.className = 'opsi'; tidak.textContent = '✘ Belum tepat';
        ya.addEventListener('click', () => { ya.classList.add('benar'); selesaiJawab(true, q, area); });
        tidak.addEventListener('click', () => { tidak.classList.add('salah'); selesaiJawab(false, q, area); });
        area.appendChild(kunci); area.appendChild(ya); area.appendChild(tidak);
        ya.focus();
      });
      area.appendChild(lihat);
    }

    m.hidden = false;
    kb.classList.remove('masuk'); void kb.offsetWidth; kb.classList.add('masuk');
    const pertama = $('.opsi', area); if (pertama) pertama.focus({ preventScroll: true });
  }

  function jawabPilihan(tombol, teks, q) {
    if (S.sudahJawab) return;
    const area = $('#m-jawab');
    const benar = norm(teks) === norm(q.jawaban);
    $$('.opsi', area).forEach((b) => {
      b.disabled = true;
      if (norm(b.textContent) === norm(q.jawaban)) b.classList.add('benar');
    });
    if (!benar) tombol.classList.add('salah');
    selesaiJawab(benar, q, area);
  }

  function selesaiJawab(benar, q, area) {
    if (S.sudahJawab) return;
    S.sudahJawab = true; S.terjawab++;
    $$('.opsi', area).forEach((b) => { b.disabled = true; });
    const umpan = $('#m-umpan'); umpan.replaceChildren();
    umpan.className = 'umpan ' + (benar ? 'benar' : 'salah');
    const utama = document.createElement('div');
    if (benar) {
      S.benar++; S.beruntun++;
      const poin = TEMA[S.kelas].poinDasar + Math.min(S.beruntun - 1, 5) * 2;
      S.skor += poin;
      utama.textContent = '🎉 Benar! +' + poin + ' poin' + (S.beruntun >= 3 ? ' · beruntun ' + S.beruntun + ' 🔥' : '');
      Snd.benar(); if (S.beruntun >= 3) Snd.beruntun();
      konfeti($('#kartu-besar'));
    } else {
      S.salah++; S.beruntun = 0;
      utama.textContent = 'Belum tepat. Jawabannya: ' + q.jawaban;
      Snd.salah();
    }
    umpan.appendChild(utama);
    if (q.penjelasan) { const k = document.createElement('small'); k.textContent = q.penjelasan; umpan.appendChild(k); }
    umpan.hidden = false;
    const lanjut = $('#m-lanjut'); lanjut.hidden = false; lanjut.focus({ preventScroll: true });
    updateStatus();
  }

  function tutupModal() {
    if (!S.aktif) { $('#modal').hidden = true; return; }
    const pakai = S.sudahJawab, el = S.aktif.el;
    $('#modal').hidden = true;
    if (pakai) { gantiKartu(el); }
    else { el.classList.remove('dibuka'); S.aktif = null; Snd.klik(); }
  }

  async function gantiKartu(el) {
    S.kunci = true; S.aktif = null;
    el.classList.add('pergi');
    await tunggu(kurangGerak ? 0 : 390);
    const berikut = S.deck.pop();
    if (berikut) {
      const baru = buatKartu(berikut);
      baru.classList.add('muncul');
      baru.addEventListener('animationend', () => baru.classList.remove('muncul'), { once: true });
      el.replaceWith(baru);
    } else { el.remove(); }
    updateStatus();
    if (!$$('.kartu', meja).length) { S.kunci = false; selesai(); return; }
    await tunggu(kurangGerak ? 0 : 420);
    await kocok();
    S.kunci = false;
  }

  /* ---------- Status ---------- */
  function updateStatus() {
    $('#st-skor').textContent = S.skor;
    $('#st-beruntun').textContent = S.beruntun;
    $('#st-sisa').textContent = Math.max(0, S.total - S.terjawab);
    const persen = S.total ? Math.round(S.terjawab / S.total * 100) : 0;
    $('#st-bar').style.width = persen + '%';
    $('.progres').setAttribute('aria-valuenow', String(persen));
  }

  /* ---------- Mulai dan selesai ---------- */
  async function mulai() {
    Snd.unlock(); Snd.klik();
    const btn = $('#btn-mulai'), pesan = $('#pesan-mulai');
    pesan.replaceChildren();
    btn.disabled = true;
    let bank = [];
    try { bank = await Store.list(S.kelas); }
    catch (e) { pesan.textContent = 'Soal belum bisa dimuat (' + e.message + '). Periksa koneksi lalu coba lagi.'; btn.disabled = false; return; }
    btn.disabled = false;
    if (!bank.length) {
      pesan.append('Belum ada soal untuk ' + TEMA[S.kelas].nama + '. ');
      const a = document.createElement('a'); a.href = CFG.adminUrl; a.textContent = 'Tambahkan soal dulu'; pesan.appendChild(a);
      return;
    }
    const jumlah = parseInt($('input[name=jumlah]:checked').value, 10);
    const dimeja = parseInt($('input[name=meja]:checked').value, 10);
    S.deck = acak(bank);
    if (jumlah > 0) S.deck = S.deck.slice(0, jumlah);
    Object.assign(S, { total: S.deck.length, skor: 0, beruntun: 0, benar: 0, salah: 0, terjawab: 0, nomor: 0, aktif: null, kunci: false, sudahJawab: false });
    meja.replaceChildren();
    tampilLayar('main');
    const awal = Math.min(dimeja, S.deck.length);
    for (let i = 0; i < awal; i++) tambahKartu(S.deck.pop(), i);
    Snd.acak();
    updateStatus();
    Snd.musik(S.kelas);
  }

  function selesai() {
    Snd.stopMusik();
    S.kunci = false; S.aktif = null;
    $('#modal').hidden = true;
    const total = S.benar + S.salah;
    const persen = total ? S.benar / total : 0;
    const bintang = !total ? 0 : persen >= 0.8 ? 3 : persen >= 0.5 ? 2 : 1;
    $('#judul-akhir').textContent = !total ? 'Belum ada kartu yang dibuka' : persen >= 0.8 ? 'Luar biasa!' : persen >= 0.5 ? 'Hebat sekali!' : 'Ayo coba lagi, pasti bisa!';
    const bt = $('#ak-bintang'); bt.replaceChildren();
    for (let i = 0; i < 3; i++) { const s = document.createElement('span'); s.textContent = '⭐'; if (i >= bintang) s.className = 'mati'; bt.appendChild(s); }
    $('#ak-skor').textContent = S.skor;
    $('#ak-benar').textContent = S.benar; $('#ak-salah').textContent = S.salah;
    const kunciRekor = 'tk_rekor_' + S.kelas, lama = parseInt(bacaLokal(kunciRekor) || '0', 10);
    const rk = $('#ak-rekor');
    if (S.skor > lama && S.skor > 0) { simpanLokal(kunciRekor, String(S.skor)); rk.textContent = '🏆 Rekor baru!'; }
    else { rk.textContent = lama ? 'Rekor tertinggi: ' + lama + ' poin' : ''; }
    pilihKelas(S.kelas);
    tampilLayar('akhir');
    if (total) { Snd.selesai(); for (let i = 0; i < 3; i++) setTimeout(() => konfeti(null), i * 350); }
  }

  /* ---------- Konfeti ---------- */
  function konfeti(asal) {
    if (kurangGerak) return;
    const r = asal ? asal.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
    const x0 = r.left + r.width / 2, y0 = r.top + Math.min(r.height * 0.3, 120);
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('i'); c.className = 'konfeti';
      c.style.left = x0 + 'px'; c.style.top = y0 + 'px';
      c.style.background = sample(TEMA[S.kelas].warna);
      document.body.appendChild(c);
      const dx = (Math.random() - 0.5) * 520, dy = 260 + Math.random() * 320;
      const a = c.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }
      ], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' });
      a.onfinish = () => c.remove();
    }
  }

  /* ---------- Pasang kejadian ---------- */
  function init() {
    $('#btn-kembali').href = CFG.backUrl;
    $('#btn-admin').href = CFG.adminUrl;

    const param = new URLSearchParams(location.search).get('kelas');
    pilihKelas(param || bacaLokal('tk_kelas') || 'sore');

    $$('.pilih-kelas button').forEach((b) => b.addEventListener('click', () => { Snd.klik(); pilihKelas(b.dataset.kelas); }));
    $('#btn-mulai').addEventListener('click', mulai);
    $('#btn-ulang').addEventListener('click', mulai);
    $('#btn-menu').addEventListener('click', () => { Snd.klik(); Snd.stopMusik(); tampilLayar('mulai'); });
    $('#m-lanjut').addEventListener('click', () => { Snd.klik(); tutupModal(); });
    $('#m-tutup').addEventListener('click', tutupModal);
    $('#btn-kocok').addEventListener('click', async () => {
      if (S.kunci || S.aktif) return;
      S.kunci = true; await kocok(); S.kunci = false;
    });
    $('#btn-selesai').addEventListener('click', () => {
      if (S.aktif) return;
      if (S.terjawab === 0 || confirm('Selesai bermain sekarang?')) { if (S.terjawab === 0) { Snd.stopMusik(); tampilLayar('mulai'); } else selesai(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) tutupModal(); });

    const sfx = $('#btn-sfx'), mus = $('#btn-musik'), p = Snd.pref();
    sfx.setAttribute('aria-pressed', String(p.sfx)); mus.setAttribute('aria-pressed', String(p.musik));
    sfx.addEventListener('click', () => { const on = sfx.getAttribute('aria-pressed') !== 'true'; sfx.setAttribute('aria-pressed', String(on)); Snd.setSfx(on); if (on) Snd.klik(); });
    mus.addEventListener('click', () => {
      const on = mus.getAttribute('aria-pressed') !== 'true';
      mus.setAttribute('aria-pressed', String(on)); Snd.setMusik(on);
      if (on && $('#layar-main').classList.contains('aktif')) Snd.musik(S.kelas);
    });
  }

  init();
})();