/* Suara Tebak Kartu — semua dibuat lewat Web Audio API, tanpa file mp3 */
(function () {
  'use strict';
  let ctx = null, master, sfxBus, musicBus, timer = null;
  let pref = { sfx: true, musik: true };
  try { pref = Object.assign(pref, JSON.parse(localStorage.getItem('tk_suara') || '{}')); } catch (e) { /* abaikan */ }
  const save = () => { try { localStorage.setItem('tk_suara', JSON.stringify(pref)); } catch (e) { /* abaikan */ } };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = pref.sfx ? 1 : 0; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = pref.musik ? 0.5 : 0; musicBus.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function nada(bus, o) {
    const midi = o.midi, t = o.t || 0, dur = o.dur || 0.25, type = o.type || 'sine', vol = o.vol || 0.2, slide = o.slide || 0;
    const s = ctx.currentTime + t;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(hz(midi), s);
    if (slide) osc.frequency.exponentialRampToValueAtTime(hz(midi + slide), s + dur);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(vol, s + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    osc.connect(g); g.connect(bus); osc.start(s); osc.stop(s + dur + 0.05);
  }

  function desir(o) {
    const t = o.t || 0, dur = o.dur || 0.18, from = o.from || 1200, to = o.to || 4200, vol = o.vol || 0.18;
    const s = ctx.currentTime + t;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, s); f.frequency.exponentialRampToValueAtTime(to, s + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, s); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus); src.start(s);
  }

  const ok = (fn) => function () { if (unlock() && pref.sfx) fn.apply(null, arguments); };

  const sfx = {
    klik: ok(() => nada(sfxBus, { midi: 79, dur: 0.08, type: 'triangle', vol: 0.12 })),
    balik: ok(() => {
      desir({ dur: 0.22, from: 900, to: 3800 });
      nada(sfxBus, { midi: 72, t: 0.1, dur: 0.12, type: 'triangle', vol: 0.1, slide: 7 });
    }),
    acak: ok(() => {
      for (let i = 0; i < 6; i++) desir({ t: i * 0.07, dur: 0.12, from: 700 + i * 150, to: 2600 + i * 200, vol: 0.12 });
    }),
    benar: ok(() => [72, 76, 79, 84].forEach((m, i) => nada(sfxBus, { midi: m, t: i * 0.09, dur: 0.28, type: 'triangle', vol: 0.2 }))),
    salah: ok(() => {
      nada(sfxBus, { midi: 55, dur: 0.32, type: 'sine', vol: 0.22, slide: -4 });
      nada(sfxBus, { midi: 52, t: 0.14, dur: 0.38, type: 'sine', vol: 0.2, slide: -4 });
    }),
    beruntun: ok(() => [84, 88, 91, 96].forEach((m, i) => nada(sfxBus, { midi: m, t: 0.35 + i * 0.07, dur: 0.2, type: 'sine', vol: 0.13 }))),
    selesai: ok(() => {
      [[72, 0], [76, 0.14], [79, 0.28], [84, 0.42], [79, 0.6], [84, 0.74], [88, 0.9]]
        .forEach((p) => nada(sfxBus, { midi: p[0], t: p[1], dur: 0.4, type: 'triangle', vol: 0.2 }));
      [60, 64, 67].forEach((m) => nada(sfxBus, { midi: m, t: 0.9, dur: 1.2, type: 'sine', vol: 0.12 }));
    })
  };

  /* ---------- Musik latar (diracik langsung, tidak ada file) ---------- */
  const TEMA = {
    // Sore: ceria dan lincah, tangga nada pentatonik
    sore: {
      dur: 0.27,
      akor: [[48, 55, 60], [45, 52, 57], [41, 48, 53], [43, 50, 55]],
      melodi: [72, 74, 76, 79, 81, 84],
      main(step, t, bus) {
        const a = this.akor[Math.floor(step / 8) % 4];
        if (step % 4 === 0) nada(bus, { midi: a[0], t: t, dur: 0.5, type: 'triangle', vol: 0.16 });
        if (step % 2 === 0) nada(bus, { midi: a[1 + (step / 2) % 2], t: t, dur: 0.2, type: 'sine', vol: 0.06 });
        if (Math.random() < 0.55) nada(bus, { midi: this.melodi[Math.floor(Math.random() * this.melodi.length)], t: t, dur: 0.22, type: 'triangle', vol: 0.09 });
      }
    },
    // Malam: pelan dan tenang, dengung lembut
    malam: {
      dur: 0.9,
      akor: [[50, 57, 62], [46, 53, 58], [48, 55, 60], [45, 52, 57]],
      melodi: [69, 72, 74, 76, 79, 81],
      main(step, t, bus) {
        const a = this.akor[Math.floor(step / 4) % 4];
        if (step % 4 === 0) a.forEach((m) => nada(bus, { midi: m, t: t, dur: 3.4, type: 'sine', vol: 0.07 }));
        if (Math.random() < 0.4) nada(bus, { midi: this.melodi[Math.floor(Math.random() * this.melodi.length)], t: t + 0.05, dur: 1.4, type: 'sine', vol: 0.07 });
      }
    }
  };

  function musik(kelas) {
    stopMusik();
    if (!unlock()) return;
    const th = TEMA[kelas] || TEMA.sore;
    let step = 0, next = ctx.currentTime + 0.15;
    timer = setInterval(() => {
      while (next < ctx.currentTime + 0.5) {
        th.main(step, Math.max(0, next - ctx.currentTime), musicBus);
        next += th.dur; step++;
      }
    }, 120);
  }
  function stopMusik() { if (timer) { clearInterval(timer); timer = null; } }

  function setSfx(on) { pref.sfx = on; save(); if (ctx) sfxBus.gain.value = on ? 1 : 0; }
  function setMusik(on) { pref.musik = on; save(); if (ctx) musicBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.1); }

  window.TKSound = Object.assign({ unlock, musik, stopMusik, setSfx, setMusik, pref: () => Object.assign({}, pref) }, sfx);
})();
