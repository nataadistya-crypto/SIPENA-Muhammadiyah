/* Penyimpanan soal Tebak Kartu
 * Satu antarmuka, dua tujuan: localStorage (uji coba) atau API server.
 * Bentuk satu soal:
 * { id, kelas: 'sore'|'malam'|'semua', kategori, visual, pertanyaan,
 *   jawaban, pilihan: [..] (boleh kosong), penjelasan }
 */
(function () {
  'use strict';
  const CFG = Object.assign({ mode: 'local', apiBase: '/api/tebak-kartu' }, window.TEBAK_KARTU_CONFIG || {});
  const KEY = 'tk_soal_v1';
  const KURIKULUM_KEY = 'tk_kurikulum_agama_v2';

  const S = (kelas, kategori, visual, pertanyaan, jawaban, salah, penjelasan) => ({
    kelas, kategori, visual, pertanyaan, jawaban,
    pilihan: salah && salah.length ? [jawaban].concat(salah) : [], penjelasan: penjelasan || ''
  });

  /* Soal contoh supaya game langsung bisa dicoba. Silakan ganti lewat halaman admin. */
  const CONTOH = [
    // ----- Kelas Sore: dasar huruf Arab dan agama untuk anak kecil -----
    S('sore', 'Huruf hijaiyah', 'ب', 'Huruf ini namanya apa?', 'Ba', ['Ta', 'Tsa']),
    S('sore', 'Huruf hijaiyah', 'ا', 'Huruf ini namanya apa?', 'Alif', ['Ba', 'Jim']),
    S('sore', 'Huruf hijaiyah', 'ج', 'Huruf ini namanya apa?', 'Jim', ['Ha', 'Kha']),
    S('sore', 'Huruf hijaiyah', 'د', 'Huruf ini namanya apa?', 'Dal', ['Ra', 'Zai']),
    S('sore', 'Huruf hijaiyah', 'م', 'Huruf ini namanya apa?', 'Mim', ['Nun', 'Waw']),
    S('sore', 'Huruf hijaiyah', 'ت', 'Huruf ini namanya apa? (titik dua di atas)', 'Ta', ['Ba', 'Tsa']),
    S('sore', 'Doa harian', '🍚', 'Sebelum makan, kita memulai dengan membaca apa?', 'Bismillah', ['Alhamdulillah', 'Astaghfirullah'], 'Sebelum makan kita berdoa dan memulai dengan Bismillah.'),
    S('sore', 'Doa harian', '😴', 'Sebelum tidur kita membaca apa?', 'Bismika Allahumma ahya wa amut', ['Alhamdulillah', 'Subhanallah']),
    S('sore', 'Agama Islam', '📖', 'Kitab suci umat Islam namanya apa?', 'Al-Qur\'an', ['Injil', 'Taurat']),
    S('sore', 'Agama Islam', '🕌', 'Dalam sehari semalam, kita shalat wajib berapa kali?', '5 kali', ['3 kali', '7 kali'], 'Shubuh, Dzuhur, Ashar, Maghrib, dan Isya.'),
    S('sore', 'Agama Islam', '🌟', 'Siapa nabi terakhir?', 'Nabi Muhammad SAW', ['Nabi Musa', 'Nabi Isa']),
    S('sore', 'Agama Islam', '🐘', 'Surah apa yang menceritakan pasukan bergajah?', 'Al-Fil', ['Al-Ikhlas', 'An-Nas'], 'Al-Fil artinya gajah.'),
    S('sore', 'Harakat dasar', 'بَ', 'Huruf ba berharakat fathah dibaca bagaimana?', 'Ba', ['Bi', 'Bu']),
    S('sore', 'Harakat dasar', 'بِ', 'Huruf ba berharakat kasrah dibaca bagaimana?', 'Bi', ['Ba', 'Bu']),
    S('sore', 'Harakat dasar', 'بُ', 'Huruf ba berharakat dammah dibaca bagaimana?', 'Bu', ['Ba', 'Bi']),
    S('sore', 'Huruf hijaiyah', 'ث', 'Huruf yang memiliki tiga titik di atas ini bernama apa?', 'Tsa', ['Ta', 'Ba']),
    S('sore', 'Doa harian', '🤲', 'Apa ucapan kita saat bersyukur kepada Allah?', 'Alhamdulillah', ['Astaghfirullah', 'Subhanallah']),
    S('sore', 'Adab Islami', 'السلام عليكم', 'Apa salam yang kita ucapkan saat bertemu sesama muslim?', 'Assalamu alaikum', ['Alhamdulillah', 'Insya Allah']),
    // ----- Kelas Malam: pendalaman Al-Qur'an, tajwid, dan sambung ayat -----
    S('malam', 'Al-Qur\'an', '📖', 'Surah pertama dalam Al-Qur\'an adalah?', 'Al-Fatihah', ['Al-Baqarah', 'An-Nas', 'Al-Ikhlas']),
    S('malam', 'Al-Qur\'an', '🔢', 'Berapa jumlah surah dalam Al-Qur\'an?', '114', ['30', '99', '124']),
    S('malam', 'Al-Qur\'an', '📚', 'Berapa jumlah juz dalam Al-Qur\'an?', '30', ['114', '40', '15']),
    S('malam', 'Al-Qur\'an', '🧱', 'Surah terpanjang dalam Al-Qur\'an adalah?', 'Al-Baqarah', ['Ali Imran', 'An-Nisa', 'Al-Fatihah']),
    S('malam', 'Al-Qur\'an', '✨', 'Surah terakhir dalam mush-haf adalah?', 'An-Nas', ['Al-Falaq', 'Al-Ikhlas', 'Al-Kautsar']),
    S('malam', 'Al-Qur\'an', '🙏', 'Surah apa yang tidak diawali dengan Basmalah?', 'At-Taubah', ['Al-Anfal', 'Yunus', 'Hud']),
    S('malam', 'Al-Qur\'an', '3️⃣', 'Surah terpendek dalam Al-Qur\'an (3 ayat) adalah?', 'Al-Kautsar', ['Al-Ikhlas', 'Al-Asr', 'An-Nas']),
    S('malam', 'Tajwid', 'نْ + ب', 'Nun mati atau tanwin bertemu huruf Ba, hukum bacaannya?', 'Iqlab', ['Idzhar', 'Ikhfa', 'Idgham'], 'Dibaca seperti mim dengan dengung.'),
    S('malam', 'Tajwid', 'ي ر م ل و ن', 'Huruf-huruf ini termasuk hukum bacaan apa jika bertemu nun mati?', 'Idgham', ['Iqlab', 'Idzhar', 'Ikhfa']),
    S('malam', 'Tajwid', 'ء ه ع ح غ خ', 'Huruf-huruf ini adalah huruf apa?', 'Idzhar halqi', ['Idgham bighunnah', 'Iqlab', 'Ikhfa'], 'Idzhar halqi ada 6 huruf, dibaca jelas tanpa dengung.'),
    S('malam', 'Tajwid', '🎵', 'Mad thabi\'i dibaca berapa harakat?', '2 harakat', ['4 harakat', '6 harakat', '1 harakat']),
    S('malam', 'Tajwid', '🔊', 'Idgham bighunnah terdiri dari berapa huruf?', '4 huruf', ['6 huruf', '2 huruf', '15 huruf'], 'Huruf-hurufnya: ي ن م و.'),
    S('malam', 'Tajwid', '🌬️', 'Berapa jumlah huruf ikhfa haqiqi?', '15 huruf', ['6 huruf', '4 huruf', '10 huruf']),
    S('malam', 'Rukun Islam', '🌙', 'Rukun Islam yang keempat adalah?', 'Puasa Ramadhan', ['Zakat', 'Shalat', 'Haji'], 'Urutannya: syahadat, shalat, zakat, puasa Ramadhan, haji.'),
    S('malam', 'Rukun Iman', '☝️', 'Ada berapa rukun iman?', '6', ['5', '7', '4']),
    S('malam', 'Sejarah Islam', '🌍', 'Siapa khalifah pertama setelah Rasulullah wafat?', 'Abu Bakar Ash-Shiddiq', ['Umar bin Khattab', 'Utsman bin Affan', 'Ali bin Abi Thalib']),
    S('malam', 'Akhlak', '🤝', 'Mengucapkan salam ketika bertemu sesama muslim hukumnya?', 'Sunnah', ['Wajib', 'Makruh', 'Haram'], 'Menjawab salam hukumnya wajib.'),
    S('malam', 'Tajwid', '📣', 'Tanda tasydid (ّ) pada huruf artinya huruf itu dibaca?', 'Dobel (ditekan)', ['Panjang', 'Samar', 'Berhenti']),
    S('malam', 'Sambung ayat', 'قُلْ هُوَ اللَّهُ أَحَدٌ', 'Lanjutkan ayat Surah Al-Ikhlas: "Qul huwallahu ahad."', 'Allahus-samad', ['Lam yalid wa lam yulad', 'Wa lam yakun lahu kufuwan ahad'], 'Lanjutan ayatnya adalah "Allahus-samad."'),
    S('malam', 'Sambung ayat', 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', 'Lanjutkan ayat Surah Al-Kautsar: "Fa salli li rabbika wanhar."', 'Inna syaniaka huwal abtar', ['Inna ataina kal kautsar', 'Wa ra-aitan nasa yadkhuluna fi dinillah'], 'Ini adalah ayat ketiga Surah Al-Kautsar.'),
    S('malam', 'Sambung ayat', 'مِنْ شَرِّ مَا خَلَقَ', 'Dalam Surah Al-Falaq, apa lanjutan setelah "Min syarri ma khalaq"?', 'Wa min syarri ghasiqin iza waqab', ['Qul a-uzu birabbil falaq', 'Wa min syarrin-naffasati fil uqad'], 'Lanjutan ayatnya adalah "Wa min syarri ghasiqin iza waqab."'),
    S('malam', 'Sambung ayat', 'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', 'Lanjutkan ayat Surah An-Nas setelah "Min syarril-waswasil-khannas."', 'Allazi yuwaswisu fi sudurinnas', ['Malikin-nas', 'Ilahin-nas'], 'Lanjutan ayatnya adalah "Allazi yuwaswisu fi sudurinnas."'),
    S('malam', 'Tajwid', 'نْ + ي', 'Nun sukun bertemu huruf ya, termasuk hukum bacaan apa?', 'Idgham bighunnah', ['Iqlab', 'Idzhar halqi', 'Ikhfa haqiqi'], 'Idgham bighunnah dibaca melebur dengan dengung.'),
    S('malam', 'Tajwid', 'ق ط ب ج د', 'Lima huruf qalqalah dirangkum dalam sebutan apa?', 'Qutbu jaddin', ['Yanmu', 'Aqsaqal', 'Hams'])
  ];
  const SOAL_LAMA_NON_AGAMA = new Set([
    'Berapa hasil 2 + 3?',
    'Berapa hasil 5 + 4?',
    'Ada berapa apel pada gambar?',
    'Berapa hasil 10 − 4?',
    'Huruf pertama dari kata BUKU adalah?',
    'Kata ini dibaca apa? K-U-C-I-N-G'
  ]);

  function buatId() { return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  const bersih = (s) => String(s == null ? '' : s).trim();
  const kunciSoal = (q) => [q.kelas, q.visual, q.pertanyaan].map((s) => bersih(s).toLowerCase()).join('|');

  function rapikan(q) {
    const jawaban = bersih(q.jawaban);
    let pilihan = Array.isArray(q.pilihan) ? q.pilihan.map(bersih).filter(Boolean) : [];
    pilihan = pilihan.filter((p, i) => pilihan.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i);
    if (pilihan.length && !pilihan.some((p) => p.toLowerCase() === jawaban.toLowerCase())) pilihan.unshift(jawaban);
    if (pilihan.length < 2) pilihan = [];
    return {
      id: q.id || buatId(),
      kelas: ['sore', 'malam', 'semua'].indexOf(q.kelas) >= 0 ? q.kelas : 'semua',
      kategori: bersih(q.kategori),
      visual: bersih(q.visual),
      pertanyaan: bersih(q.pertanyaan),
      jawaban: jawaban,
      pilihan: pilihan,
      penjelasan: bersih(q.penjelasan)
    };
  }
  function valid(q) { return !!(q.pertanyaan && q.jawaban); }

  /* ---------- mode lokal ---------- */
  function bacaLokal() {
    let arr;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) arr = JSON.parse(raw);
    } catch (e) { /* jatuh ke contoh */ }
    if (!Array.isArray(arr)) arr = CONTOH.map((q) => rapikan(q));

    try {
      if (localStorage.getItem(KURIKULUM_KEY) !== '1') {
        arr = arr.filter((q) => q && !(q.kelas === 'sore' && SOAL_LAMA_NON_AGAMA.has(q.pertanyaan)));
        const sudahAda = new Set(arr.map(kunciSoal));
        CONTOH.forEach((q) => {
          if (!sudahAda.has(kunciSoal(q))) {
            arr.push(rapikan(q));
            sudahAda.add(kunciSoal(q));
          }
        });
        tulisLokal(arr);
        localStorage.setItem(KURIKULUM_KEY, '1');
      }
    } catch (e) { /* pakai soal yang sudah diperbarui selama sesi ini */ }
    return arr;
  }
  function tulisLokal(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); }
    catch (e) { throw new Error('Browser tidak mengizinkan penyimpanan. Buka lewat alamat web (bukan file langsung) atau gunakan mode API.'); }
  }

  /* ---------- mode API ---------- */
  async function api(path, opt) {
    const r = await fetch(CFG.apiBase + path, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }, opt));
    if (!r.ok) throw new Error('Server menjawab ' + r.status);
    return r.status === 204 ? null : r.json();
  }

  const cocok = (q, kelas) => !kelas || q.kelas === 'semua' || q.kelas === kelas;

  const Store = {
    mode: CFG.mode,
    async list(kelas) {
      if (CFG.mode === 'api') {
        const data = await api('/soal' + (kelas ? '?kelas=' + encodeURIComponent(kelas) : ''));
        return data.map(rapikan).filter(valid);
      }
      return bacaLokal().map(rapikan).filter((q) => valid(q) && cocok(q, kelas));
    },
    async simpan(q) {
      const baru = rapikan(q);
      if (!valid(baru)) throw new Error('Pertanyaan dan jawaban wajib diisi.');
      if (CFG.mode === 'api') {
        return q.id ? api('/soal/' + encodeURIComponent(q.id), { method: 'PUT', body: JSON.stringify(baru) })
                    : api('/soal', { method: 'POST', body: JSON.stringify(baru) });
      }
      const arr = bacaLokal(), i = arr.findIndex((x) => x.id === baru.id);
      if (i >= 0) arr[i] = baru; else arr.push(baru);
      tulisLokal(arr);
      return baru;
    },
    async hapus(id) {
      if (CFG.mode === 'api') return api('/soal/' + encodeURIComponent(id), { method: 'DELETE' });
      tulisLokal(bacaLokal().filter((q) => q.id !== id));
      return null;
    },
    async impor(arr) {
      const baik = arr.map((q) => rapikan(Object.assign({}, q, { id: '' }))).filter(valid);
      for (const q of baik) await Store.simpan(Object.assign({}, q, { id: '' }));
      return baik.length;
    },
    async ekspor() { return Store.list(); },
    async kembalikanContoh() {
      if (CFG.mode === 'api') throw new Error('Pemulihan soal contoh hanya untuk mode lokal.');
      tulisLokal(CONTOH.map((q) => rapikan(q)));
    },
    rapikan: rapikan
  };

  window.TKStore = Store;
})();
