(function () {
  'use strict';

  const AudioContext = window.AudioContext || window.webkitAudioContext;

  function create(options) {
    const config = Object.assign({
      storageKey: 'tpq-game-audio',
      musicButton: null,
      soundButton: null,
      melody: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46]
    }, options || {});
    let settings = { music: true, sound: true };
    try {
      settings = Object.assign(settings, JSON.parse(localStorage.getItem(config.storageKey) || '{}'));
    } catch (error) {
      console.warn('Preferensi audio tidak dapat dibaca.', error);
    }

    let context = null, musicTimer = null, musicStep = 0, musicRequested = false;
    let musicGain = null, soundGain = null;

    function save() {
      try {
        localStorage.setItem(config.storageKey, JSON.stringify(settings));
      } catch (error) {
        console.warn('Preferensi audio tidak dapat disimpan.', error);
      }
    }

    function updateButtons() {
      if (config.soundButton) {
        config.soundButton.setAttribute('aria-pressed', String(settings.sound));
        config.soundButton.textContent = settings.sound ? '🔊 Suara: Aktif' : '🔇 Suara: Mati';
      }
      if (config.musicButton) {
        config.musicButton.setAttribute('aria-pressed', String(settings.music));
        config.musicButton.textContent = settings.music ? '🎵 Musik: Aktif' : '🎵 Musik: Mati';
      }
    }

    function unlock() {
      if (!AudioContext) return null;
      if (!context) {
        context = new AudioContext();
        soundGain = context.createGain();
        musicGain = context.createGain();
        soundGain.gain.value = settings.sound ? 0.55 : 0;
        musicGain.gain.value = settings.music ? 0.16 : 0;
        soundGain.connect(context.destination);
        musicGain.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch((error) => {
        console.warn('Audio tidak dapat dimulai.', error);
      });
      return context;
    }

    function tone(frequency, duration, target, type, volume, delay) {
      const ctx = unlock();
      if (!ctx || !target) return;
      const start = ctx.currentTime + (delay || 0);
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume || 0.2, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(target);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    function play(name) {
      if (!settings.sound) return;
      const sounds = {
        click: [[660, 0.08]],
        start: [[523.25, 0.12], [659.25, 0.14, 0.1], [783.99, 0.22, 0.2]],
        correct: [[659.25, 0.12], [783.99, 0.12, 0.1], [987.77, 0.22, 0.2]],
        wrong: [[293.66, 0.16], [246.94, 0.22, 0.12]],
        spin: [[392, 0.12], [523.25, 0.12, 0.09], [659.25, 0.16, 0.18]],
        land: [[783.99, 0.12], [1046.5, 0.25, 0.1]],
        reward: [[659.25, 0.12], [783.99, 0.12, 0.11], [987.77, 0.12, 0.22], [1318.51, 0.28, 0.33]],
        finish: [[523.25, 0.16], [659.25, 0.16, 0.14], [783.99, 0.28, 0.28]]
      };
      (sounds[name] || sounds.click).forEach((note) => {
        tone(note[0], note[1], soundGain, 'triangle', 0.25, note[2]);
      });
    }

    function startMusic() {
      musicRequested = true;
      if (!settings.music || musicTimer) return;
      if (!unlock()) return;
      const playStep = () => {
        const index = musicStep % config.melody.length;
        tone(config.melody[index], 0.3, musicGain, 'sine', 0.17);
        if (index % 4 === 0) tone(config.melody[index] / 2, 0.55, musicGain, 'triangle', 0.1);
        musicStep++;
      };
      playStep();
      musicTimer = window.setInterval(playStep, 360);
    }

    function stopMusic() {
      musicRequested = false;
      window.clearInterval(musicTimer);
      musicTimer = null;
    }

    function setSound(enabled) {
      settings.sound = enabled;
      if (soundGain) soundGain.gain.setTargetAtTime(enabled ? 0.55 : 0, context.currentTime, 0.03);
      save();
      updateButtons();
      if (!enabled && window.speechSynthesis) window.speechSynthesis.cancel();
    }

    function setMusic(enabled) {
      settings.music = enabled;
      if (musicGain) musicGain.gain.setTargetAtTime(enabled ? 0.16 : 0, context.currentTime, 0.05);
      save();
      updateButtons();
      if (enabled && musicRequested) startMusic();
      if (!enabled) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    }

    if (config.soundButton) config.soundButton.addEventListener('click', () => {
      unlock();
      setSound(!settings.sound);
      if (settings.sound) play('click');
    });
    if (config.musicButton) config.musicButton.addEventListener('click', () => {
      unlock();
      setMusic(!settings.music);
      if (settings.music && musicRequested) startMusic();
    });
    updateButtons();

    return {
      unlock,
      play,
      startMusic,
      stopMusic,
      isSoundEnabled: () => settings.sound
    };
  }

  window.TPQGameAudio = { create };
})();
