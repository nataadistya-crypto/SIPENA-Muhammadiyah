(function () {
  const page = decodeURIComponent((location.pathname.split('/').pop() || 'login.html')).toLowerCase();
  const root = document.getElementById('app');
  if (!root) return;
  document.title = document.title.replace(/ - .+$/, ' - SIPENA Muhammadiyah');

  function applySettings(settings) {
    if (/^#[0-9a-f]{6}$/i.test(settings.primary || '')) {
      document.documentElement.style.setProperty('--brand-primary', settings.primary);
    }
    if (/^#[0-9a-f]{6}$/i.test(settings.secondary || '')) {
      document.documentElement.style.setProperty('--brand-secondary', settings.secondary);
    }
    document.documentElement.style.setProperty(
      '--cover-image',
      settings.cover ? `url("/api/cover?v=${Date.now()}")` : 'none',
    );
  }

  async function loadPublicSettings() {
    try {
      const response = await fetch('/api/pengaturan');
      if (!response.ok) throw new Error('Pengaturan tampilan tidak dapat dimuat.');
      applySettings(await response.json());
    } catch (error) {
      console.error('Gagal memuat pengaturan tampilan:', error);
    }
  }

  loadPublicSettings();

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function newId(prefix) {
    const value = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${value}`;
  }

  function navLinks(role) {
    const base = role === 'u'
      ? [
          ['dashbord ustadzah.html', 'Dashboard'],
          ['data murid.html', 'Murid'],
          ['absensi.html', 'Absensi'],
          ['capaian.html', 'Capaian'],
          ['tugas nilai.html', 'Tugas & nilai'],
          ['materi.html', 'Materi'],
          ['games sore.html', 'Games'],
          ['akun wali murid.html', 'Akun wali'],
          ['laporan.html', 'Laporan'],
        ]
      : role === 'c'
        ? [[window.__tpqMe?.k === 'malam' ? 'games malam.html' : 'games sore.html', 'Games']]
        : role === 'a'
        ? [['admin-panel.html', 'Panel Admin']]
        : [
          ['dashbord walimurid.html', 'Dashboard'],
          ['wali  ganti sandi.html', 'Ganti sandi'],
          ['materi.html', 'Materi'],
          ['games sore.html', 'Games'],
          ['laporan.html', 'Laporan'],
        ];

    return base.map(([href, label]) => {
      const currentPage = page.replace(/\s+/g, '');
      const targetPage = href.replace(/\s+/g, '').toLowerCase();
      const active = currentPage.includes(targetPage)
        || (href.includes('dashbord') && page.includes('dashbord'))
        || (label === 'Games' && page.includes('games'));
      return `<button class="${active ? 'on' : ''}" data-link="${href}">${escapeHtml(label)}</button>`;
    }).join('');
  }

  function logoutNavButton() {
    return '<button id="logout-btn" class="nav-logout" type="button">Keluar</button>';
  }

  function pageTitleMap(role) {
    const map = {
      login: 'Login',
      dashboard: role === 'u' ? 'Dashboard Ustadzah' : role === 'a' ? 'Panel Admin' : 'Dashboard Wali Murid',
      murid: 'Data Murid',
      absensi: 'Absensi',
      capaian: 'Capaian',
      tugas: 'Tugas & Nilai',
      materi: 'Materi',
      games: 'Games',
      akun: 'Akun Wali Murid',
      laporan: 'Laporan',
      ganti: 'Ganti Sandi',
    };

    if (page.includes('login')) return map.login;
    if (page.includes('dashbord')) return map.dashboard;
    if (page.includes('data')) return map.murid;
    if (page.includes('absensi')) return map.absensi;
    if (page.includes('capaian')) return map.capaian;
    if (page.includes('tugas')) return map.tugas;
    if (page.includes('materi')) return map.materi;
    if (page.includes('games')) return map.games;
    if (page.includes('wali') && page.includes('sandi')) return map.ganti;
    if (page.includes('akun')) return map.akun;
    if (page.includes('laporan')) return map.laporan;
    return map.dashboard;
  }

  function getRoleLabel(role) {
    return role === 'u' ? 'Ustadzah' : role === 'a' ? 'Admin' : role === 'c' ? 'Anak' : 'Wali Murid';
  }

  function renderLogin() {
    const loginPages = {
      'login-ustadzah.html': {
        role: 'u',
        label: 'Ustadzah',
        icon: '👩‍🏫',
        identifier: 'Username',
        placeholder: 'Masukkan username',
        passwordLabel: 'Kata sandi',
        passwordPlaceholder: 'Masukkan kata sandi akun',
        guide: 'Buat akun dengan nama, username, dan kata sandi. Email bersifat opsional.',
      },
      'login-wali-murid.html': {
        role: 'w',
        label: 'Wali Murid',
        icon: '👪',
        identifier: 'Username (nama murid)',
        placeholder: 'Masukkan nama murid',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Masukkan nomor absen',
        guide: 'Username adalah nama murid; password awal mengikuti nomor absen. Pilih ustadzah yang mendaftarkan ananda.',
      },
      'login-anak.html': {
        role: 'c',
        label: 'Anak',
        icon: '🧒',
        identifier: 'Username (nama anak)',
        placeholder: 'Masukkan nama anak',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Masukkan nomor absen atau password akun',
        guide: 'Gunakan username dan password yang sama dengan akun Wali Murid. Akun Anak hanya dapat membuka Games.',
      },
      'admin.html': {
        role: 'a',
        label: 'Admin',
        icon: '🛡️',
        identifier: 'Nama pengguna',
        placeholder: 'Masukkan nama pengguna',
        passwordLabel: 'Kata sandi',
        passwordPlaceholder: 'Masukkan kata sandi',
        guide: 'Gunakan akun administrator yang telah dikonfigurasi.',
      },
    };

    if (page === 'login.html') {
      const roles = [
        { label: 'Ustadzah', icon: '👩‍🏫', href: '/login-ustadzah.html', description: 'Masuk untuk mengelola pembelajaran dan data kelas.' },
        { label: 'Wali Murid', icon: '👪', href: '/login-wali-murid.html', description: 'Masuk untuk memantau perkembangan belajar ananda.' },
        { label: 'Anak', icon: '🧒', href: '/login-anak.html', description: 'Masuk untuk bermain dan belajar melalui Games.' },
        { label: 'Admin', icon: '🛡️', href: '/admin.html', description: 'Masuk untuk mengelola pengaturan SIPENA.' },
      ];
      root.innerHTML = `
        <main class="auth-wrap">
          <div class="auth-stage login-home-stage">
            <section class="auth-visual login-home-panel" aria-labelledby="login-home-title">
              <div class="visual-glow glow-one"></div>
              <div class="visual-glow glow-two"></div>
              <div class="auth-copy login-home-copy">
                <div class="brand-mark"><img class="brand-logo" src="/assets/sipena-muhammadiyah-logo.png" alt="Logo SIPENA Muhammadiyah"></div>
                <span class="login-home-eyebrow">Selamat datang</span>
                <h1 id="login-home-title">SIPENA Muhammadiyah</h1>
                <p class="text-bubble">SIPENA Muhammadiyah adalah aplikasi pendamping kegiatan belajar di TPQ. Ustadzah dapat mengelola kelas dan pembelajaran, wali murid memantau perkembangan anak, dan anak belajar sambil bermain lewat Games.</p>
              </div>
              <nav class="login-choice-grid" aria-label="Halaman login">
                ${roles.map((role) => `
                  <a class="login-choice-card" href="${role.href}">
                    <span class="login-choice-icon" aria-hidden="true">${role.icon}</span>
                    <span class="login-choice-copy">
                      <strong>Login ${role.label}</strong>
                      <span>${role.description}</span>
                    </span>
                    <span class="login-choice-arrow" aria-hidden="true">→</span>
                  </a>
                `).join('')}
              </nav>
            </section>
          </div>
        </main>
      `;
      return;
    }

    const login = loginPages[page] || loginPages['login-ustadzah.html'];
    const selectedRole = login.role;
    root.innerHTML = `
      <main class="auth-wrap">
        <div class="auth-stage login-form-stage">
          <section class="c auth-card login-single-card" aria-labelledby="login-form-title">
            <header class="login-single-header">
              <img class="login-single-logo" src="/assets/sipena-muhammadiyah-logo.png" alt="Logo SIPENA Muhammadiyah">
              <div class="login-single-heading">
                <span class="pill">Login ${login.label}</span>
                <h1 id="login-form-title">Masuk sebagai ${login.label}</h1>
              </div>
            </header>
            ${selectedRole === 'u' ? `
              <p id="teacher-email-status" class="mu" role="status" aria-live="polite" hidden></p>
            ` : ''}
            <form id="login-form" class="stacked-form">
              ${selectedRole === 'w' || selectedRole === 'c' ? `
                <div>
                  <label for="teacher-account">Ustadzah</label>
                  <select id="teacher-account" name="teacher" required>
                    <option value="">Memuat daftar ustadzah...</option>
                  </select>
                </div>
              ` : ''}
              <div>
                <label for="u">${login.identifier}</label>
                <input id="u" autocomplete="username" name="u" required placeholder="${login.placeholder}">
              </div>
              <div>
                <label for="p">${login.passwordLabel}</label>
                <input id="p" autocomplete="current-password" name="p" required type="password" placeholder="${login.passwordPlaceholder}">
              </div>
              <button class="p" type="submit">Masuk</button>
            </form>
            ${selectedRole === 'u' ? `
              <p id="registration-link" class="mu">Belum punya akun? <a id="show-registration" href="#daftar">Buat akun Ustadzah</a></p>
              <p id="registration-status" class="mu" role="status" aria-live="polite" hidden></p>
              <form id="registration-form" class="stacked-form" hidden>
                <div>
                  <label for="registration-name">Nama lengkap</label>
                  <input id="registration-name" name="name" autocomplete="name" required maxlength="100" placeholder="Masukkan nama lengkap">
                </div>
                <div>
                  <label for="registration-email">Email (opsional)</label>
                  <input id="registration-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="nama@email.com">
                </div>
                <div>
                  <label for="registration-username">Username</label>
                  <input id="registration-username" name="username" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9._]+" placeholder="3-24 huruf, angka, titik, atau garis bawah">
                </div>
                <div>
                  <label for="registration-password">Buat kata sandi</label>
                  <input id="registration-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="256" required placeholder="Minimal 8 karakter">
                </div>
                <div>
                  <label for="registration-password-confirm">Ulangi kata sandi</label>
                  <input id="registration-password-confirm" name="password-confirm" type="password" autocomplete="new-password" minlength="8" maxlength="256" required placeholder="Ulangi kata sandi">
                </div>
                <button class="p" type="submit">Buat akun</button>
                <p class="mu">Sudah punya akun? <a id="show-login" href="#masuk">Masuk di sini</a></p>
              </form>
            ` : ''}
            <p id="login-error" class="login-error" role="alert" aria-live="polite" hidden></p>
            <div class="login-role-guide">
              <p>${login.guide}</p>
              <a href="/login.html">Kembali ke pilihan jenis akun</a>
            </div>
          </section>
        </div>
      </main>
    `;

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const clearLoginError = () => {
      loginError.textContent = '';
      loginError.hidden = true;
    };
    if (loginForm) loginForm.addEventListener('input', clearLoginError);

    if (selectedRole === 'u') {
      const registrationForm = document.getElementById('registration-form');
      const registrationLink = document.getElementById('registration-link');
      const registrationStatus = document.getElementById('registration-status');

      document.getElementById('show-registration').addEventListener('click', (event) => {
        event.preventDefault();
        registrationStatus.hidden = true;
        loginForm.hidden = true;
        registrationLink.hidden = true;
        registrationForm.hidden = false;
        document.getElementById('registration-name').focus();
      });
      document.getElementById('show-login').addEventListener('click', (event) => {
        event.preventDefault();
        registrationForm.hidden = true;
        registrationLink.hidden = false;
        loginForm.hidden = false;
        clearLoginError();
        document.getElementById('u').focus();
      });
      registrationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        registrationStatus.hidden = false;
        const name = document.getElementById('registration-name').value.trim();
        const email = document.getElementById('registration-email').value.trim();
        const username = document.getElementById('registration-username').value.trim().toLowerCase();
        const password = document.getElementById('registration-password').value;
        const passwordConfirm = document.getElementById('registration-password-confirm').value;
        if (password !== passwordConfirm) {
          registrationStatus.textContent = 'Kata sandi dan ulangannya belum sama.';
          return;
        }
        const submitButton = registrationForm.querySelector('[type="submit"]');
        submitButton.disabled = true;
        registrationStatus.textContent = 'Membuat akun...';
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, username, password }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Akun gagal dibuat.');
          registrationForm.hidden = true;
          registrationLink.hidden = false;
          loginForm.hidden = false;
          document.getElementById('u').value = result.username;
          document.getElementById('registration-password').value = '';
          document.getElementById('registration-password-confirm').value = '';
          registrationStatus.textContent = 'Akun berhasil dibuat. Silakan masuk dengan username dan kata sandi yang Anda buat.';
          document.getElementById('p').focus();
        } catch (error) {
          console.error('Pendaftaran akun Ustadzah gagal:', error);
          registrationStatus.textContent = error.message || 'Pendaftaran gagal. Silakan coba lagi.';
        } finally {
          submitButton.disabled = false;
        }
      });
    }

    if (selectedRole === 'w' || selectedRole === 'c') {
      const teacherSelect = document.getElementById('teacher-account');
      fetch('/api/ustadzah')
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Daftar ustadzah tidak dapat dimuat.');
          teacherSelect.innerHTML = '<option value="">Pilih ustadzah</option>' + (result.ustadzah || [])
            .map((teacher) => `<option value="${escapeHtml(teacher.id)}">${escapeHtml(teacher.nama)}</option>`)
            .join('');
          if (!result.ustadzah?.length) {
            teacherSelect.innerHTML = '<option value="">Belum ada akun ustadzah</option>';
          }
        })
        .catch((error) => {
          console.error('Gagal memuat daftar ustadzah:', error);
          teacherSelect.innerHTML = '<option value="">Daftar ustadzah gagal dimuat</option>';
          loginError.textContent = error.message || 'Daftar ustadzah gagal dimuat.';
          loginError.hidden = false;
        });
    }

    if (loginForm) loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearLoginError();
      const u = document.getElementById('u').value.trim();
      const p = document.getElementById('p').value;
      try {
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            u,
            p,
            r: selectedRole,
            teacher: selectedRole === 'w' || selectedRole === 'c' ? document.getElementById('teacher-account').value : '',
          })
        });
        const data = await resp.json();
        if (!resp.ok) {
          loginError.textContent = data.error === 'Login gagal'
            ? 'Nama akun atau sandi salah. Periksa kembali lalu coba lagi.'
            : (data.error || 'Login gagal. Silakan coba lagi.');
          loginError.hidden = false;
          return;
        }
        const user = data.me || {};
        const target = user.r === 'a' ? '/admin-panel.html'
          : user.r === 'u' ? '/dashbord%20ustadzah.html'
            : user.r === 'c' ? (user.k === 'malam' ? '/games%20malam.html' : '/games%20sore.html')
              : '/dashbord%20walimurid.html';
        location.href = target;
      } catch (error) {
        console.error('Gagal mengirim permintaan login:', error);
        loginError.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
        loginError.hidden = false;
      }
    });
  }

  function renderDashboard(data) {
    const me = data.me || {};
    const db = data.db || {};
    const murid = db.m || [];
    const materi = db.mt || [];
    const tugas = db.t || [];
    const absensi = db.a || [];
    const capaian = [...(db.c || [])].sort((a, b) => String(b.t || '').localeCompare(String(a.t || '')));
    const muridById = new Map(murid.map((student) => [student.id, student]));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const formattedToday = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    const activeMurid = murid.filter((m) => m.st === 'aktif');
    const activeMuridIds = new Set(activeMurid.map((m) => m.id));
    const attendanceToday = absensi.filter((item) => item.t === today
      && (me.r !== 'u' || activeMuridIds.has(item.m)));
    const attendanceCounts = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    attendanceToday.forEach((item) => {
      if (Object.hasOwn(attendanceCounts, item.s)) attendanceCounts[item.s] += 1;
    });
    const childAttendanceToday = attendanceToday[0];
    const kelasCounts = { sore: 0, malam: 0 };
    activeMurid.forEach((m) => { if (m.k && kelasCounts[m.k] !== undefined) kelasCounts[m.k] += 1; });

    const stats = me.r === 'u'
      ? [
          { label: 'Murid aktif kelas sore', value: kelasCounts.sore || 0 },
          { label: 'Murid aktif kelas malam', value: kelasCounts.malam || 0 },
          { label: 'Hadir hari ini', value: attendanceCounts.Hadir },
          { label: 'Materi tersedia', value: materi.length },
        ]
      : [
          { label: 'Kelas', value: murid[0]?.k || '-' },
          { label: 'Kehadiran hari ini', value: childAttendanceToday?.s || 'Belum dicatat' },
          { label: 'Catatan kehadiran', value: absensi.length },
          { label: 'Materi kelas', value: materi.length },
        ];

    const rows = murid.slice(0, 6).map((m) => `
      <tr>
        <td>${escapeHtml(m.no ?? m.id)}</td>
        <td>${escapeHtml(m.nama)}</td>
        <td>${escapeHtml(m.k ?? '-')}</td>
        <td>${escapeHtml(m.st ?? '-')}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">Belum ada data murid.</td></tr>';

    const pageTitle = pageTitleMap(me.r);
    const quickAction = me.r === 'u'
      ? '<button class="hero-button" data-link="data murid.html">Lihat murid</button><button class="hero-button secondary" data-link="laporan.html">Laporan</button>'
      : '<button class="hero-button" data-link="wali  ganti sandi.html">Ganti sandi</button><button class="hero-button secondary" data-link="materi.html">Materi</button>';

    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const records = absensi.filter((item) => item.t === key
        && (me.r !== 'u' || activeMuridIds.has(item.m)));
      const present = records.filter((item) => item.s === 'Hadir').length;
      const primaryRecord = records[0];
      const scale = me.r === 'u' ? Math.max(activeMurid.length, 1) : 1;
      const value = me.r === 'u' ? present : (primaryRecord?.s === 'Hadir' ? 1 : 0);
      const height = records.length ? Math.max(value ? 18 : 8, Math.round((value / scale) * 100)) : 3;
      const statusClass = ({ Hadir: 'present', Izin: 'excused', Sakit: 'sick', Alpa: 'absent' })[primaryRecord?.s] || 'empty';
      return {
        day: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date),
        date: date.getDate(),
        records: records.length,
        present,
        height,
        statusClass,
      };
    });
    const weeklyBars = weekDays.map((day) => `
      <div class="weekly-day" title="${escapeHtml(day.records
        ? `${day.present} hadir${me.r === 'u' ? ` dari ${day.records} catatan` : ''}`
        : 'Belum ada catatan')}">
        <div class="weekly-bar-track"><span class="weekly-bar ${day.statusClass}" style="height:${day.height}%"></span></div>
        <strong>${me.r === 'u' ? day.present : (day.records ? (day.statusClass === 'present' ? '✓' : '•') : '—')}</strong>
        <span>${escapeHtml(day.day)}</span>
      </div>
    `).join('');

    const materialCards = materi.slice(0, 3).map((item) => `
      <article class="dashboard-material">
        <span class="material-subject">${escapeHtml(item.mp || 'Materi')}</span>
        <h4>${escapeHtml(item.j || 'Materi tanpa judul')}</h4>
        <p>${escapeHtml(item.i || 'Belum ada deskripsi materi.')}</p>
        <span class="material-class">Kelas ${escapeHtml(item.k || '-')}</span>
        ${item.file ? `<a class="material-download" href="${escapeHtml(item.file)}">Unduh PowerPoint · ${escapeHtml(item.fn || 'Buka materi')}</a>` : ''}
      </article>
    `).join('') || '<p class="mu dashboard-empty">Belum ada materi yang tersedia.</p>';

    const achievementCards = capaian.slice(0, 5).map((item) => {
      const student = muridById.get(item.m);
      const achievementDate = item.t
        ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          .format(new Date(`${item.t}T00:00:00`))
        : 'Tanggal tidak tersedia';
      const detail = [
        item.j ? `Jilid/Juz ${item.j}` : '',
        item.h ? `Halaman ${item.h}` : '',
        item.s ? `Surah ${item.s}` : '',
      ].filter(Boolean).join(' · ');
      return `
        <article class="achievement-item">
          <span class="achievement-marker">${item.l ? '✓' : '•'}</span>
          <div class="achievement-content">
            <div class="achievement-title-row">
              <strong>${escapeHtml(student?.nama || 'Murid')}</strong>
              <time>${escapeHtml(achievementDate)}</time>
            </div>
            <p>${escapeHtml(detail || item.hs || 'Catatan capaian belajar')}</p>
            ${item.hs ? `<span class="achievement-result">${escapeHtml(item.hs)}</span>` : ''}
          </div>
          <span class="achievement-status ${item.l ? 'passed' : ''}">${item.l ? 'Tuntas' : 'Proses'}</span>
        </article>
      `;
    }).join('') || '<p class="mu dashboard-empty">Belum ada catatan capaian belajar.</p>';

    const attendanceSummary = me.r === 'u'
      ? `
        <div class="attendance-status-grid">
          ${Object.entries(attendanceCounts).map(([status, count]) => `
            <div class="attendance-status">
              <span>${escapeHtml(status)}</span>
              <strong>${count}</strong>
            </div>
          `).join('')}
        </div>
        <p class="mu attendance-note">${attendanceToday.length
          ? `${attendanceToday.length} dari ${activeMurid.length} murid aktif memiliki catatan hari ini.`
          : 'Belum ada catatan absensi untuk hari ini.'}</p>
      `
      : `
        <div class="child-attendance ${childAttendanceToday ? 'recorded' : ''}">
          <span class="attendance-mark">${childAttendanceToday ? '✓' : '—'}</span>
          <div>
            <strong>${escapeHtml(childAttendanceToday?.s || 'Belum dicatat')}</strong>
            <p class="mu">${escapeHtml(formattedToday)}</p>
          </div>
        </div>
      `;

    const tableTitle = me.r === 'u' ? 'Data murid' : 'Data ananda';

    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <b>${escapeHtml(pageTitle)}</b>
          <span class="user-meta">
            ${escapeHtml(me.r === 'u' ? (me.nama || 'Ustadzah') : getRoleLabel(me.r))}
          </span>
        </header>
        <nav class="main-nav" aria-label="Navigasi utama">${navLinks(me.r)}${logoutNavButton()}</nav>
        <main class="page-main dashboard-main">
          <section class="dashboard-hero">
            <div class="dashboard-islamic-scene" aria-hidden="true"></div>
            <div class="dashboard-hero-copy">
              <span class="hero-badge">${escapeHtml(formattedToday)}</span>
              <p class="dashboard-greeting">${me.r === 'u'
                ? `Assalamu’alaikum, ${escapeHtml(me.nama || 'Ustadzah')}`
                : `Assalamu’alaikum${murid[0]?.nama ? `, ${escapeHtml(murid[0].nama)}` : ''}`}</p>
              <h1>${escapeHtml(pageTitle)}</h1>
              <p class="dashboard-intro">${me.r === 'u'
                ? 'Semangat mendampingi anak-anak belajar dan bertumbuh hari ini.'
                : 'Pantau perjalanan belajar ananda dengan lebih hangat dan mudah.'}</p>
              <div class="hero-actions">${quickAction}</div>
            </div>
            <img class="dashboard-hero-art" src="/assets/sipena-anak-pasangan.png" alt="Anak laki-laki dan perempuan muslim belajar bersama">
          </section>
          <div class="dashboard-stats" aria-label="Ringkasan SIPENA Muhammadiyah">
            ${stats.map((item) => `
              <div class="dashboard-stat">
                <strong>${escapeHtml(item.value)}</strong>
                <span>${escapeHtml(item.label)}</span>
              </div>
            `).join('')}
          </div>
          <section class="dashboard-overview">
            <div class="dashboard-weekly">
              <div class="dashboard-section-heading">
                <div><span class="section-eyebrow">Perjalanan 7 hari</span><h3>Grafik kehadiran</h3></div>
                <span class="section-date">${escapeHtml(formattedToday)}</span>
              </div>
              <div class="weekly-chart" role="img" aria-label="Grafik kehadiran selama tujuh hari terakhir">
                ${weeklyBars}
              </div>
              <p class="mu attendance-note">${me.r === 'u'
                ? `Jumlah hadir per hari dari ${activeMurid.length} murid aktif.`
                : 'Grafik menunjukkan kehadiran ananda yang sudah dicatat.'}</p>
            </div>
            <div class="dashboard-today">
              <span class="section-eyebrow">Ringkasan harian</span>
              <h3>Kehadiran hari ini</h3>
              ${attendanceSummary}
              ${me.r === 'u' ? `
                <div class="dashboard-class-summary">
                  <span class="dashboard-class-card sore"><i class="class-dot sore"></i>Kelas sore <strong>${kelasCounts.sore}</strong></span>
                  <span class="dashboard-class-card malam"><i class="class-dot malam"></i>Kelas malam <strong>${kelasCounts.malam}</strong></span>
                </div>
              ` : ''}
            </div>
          </section>
          <section class="dashboard-content">
            <div class="dashboard-main-column">
          <section class="dashboard-section">
            <div class="dashboard-section-heading">
              <div>
                <span class="section-eyebrow">Belajar bersama</span>
                <h3>Tugas dan materi</h3>
              </div>
              <span class="section-date">${tugas.length} tugas · ${materi.length} materi</span>
            </div>
            <div class="dashboard-material-heading"><h4>Materi tersedia</h4><button class="section-link" data-link="materi.html">Lihat semua</button></div>
            <div class="dashboard-material-grid">${materialCards}</div>
          </section>
          <section class="dashboard-section">
            <div class="dashboard-section-heading">
              <div>
                <span class="section-eyebrow">Perkembangan belajar</span>
                <h3>Capaian terbaru</h3>
              </div>
              ${me.r === 'u' ? '<button class="section-link" data-link="capaian.html">Lihat semua</button>' : ''}
            </div>
            <div class="achievement-list">${achievementCards}</div>
          </section>
            </div>
            <section class="dashboard-roster">
            <div class="dashboard-section-heading">
              <div><span class="section-eyebrow">Data terdaftar</span><h3>${tableTitle}</h3></div>
              ${me.r === 'u' ? '<button class="section-link" data-link="data murid.html">Lihat semua</button>' : ''}
            </div>
            <div class="w">
              <table>
                <thead>
                  <tr><th>No</th><th>Nama</th><th>Kelas</th><th>Status</th></tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            </section>
          </section>
        </main>
      </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login.html';
    });

    document.querySelectorAll('[data-link]').forEach((button) => {
      button.addEventListener('click', () => {
        location.href = button.dataset.link;
      });
    });
  }

  function renderGenericList(title, dataList, extraLabel) {
    const me = window.__tpqMe || { r: 'u' };
    const cards = dataList.length ? dataList.map((item) => `
    <div class="c list-card${item.artwork ? ' game-card' : ''}">
      ${item.artwork ? `
        <div class="game-art ${escapeHtml(item.artwork)}" role="img" aria-label="${escapeHtml(item.artLabel || item.title || 'Ilustrasi game')}">
          <span class="game-art-spark game-art-spark-one" aria-hidden="true">✦</span>
          <span class="game-art-spark game-art-spark-two" aria-hidden="true">✧</span>
          <span class="game-art-orbit game-art-orbit-one" aria-hidden="true"></span>
          <span class="game-art-orbit game-art-orbit-two" aria-hidden="true"></span>
          <span class="game-art-emoji" aria-hidden="true">${escapeHtml(item.artworkIcon || '🎮')}</span>
          <span class="game-art-caption" aria-hidden="true">${escapeHtml(item.artLabel || 'Ayo bermain!')}</span>
        </div>
      ` : ''}
      <h3>${escapeHtml(item.title || item.judul || item.nama || 'Item')}</h3>
        <p class="mu">${escapeHtml(item.meta || item.mapel || item.kelas || extraLabel || 'Data')}</p>
        <div class="tag-box">${escapeHtml(item.badge || item.status || 'Aktif')}</div>
        ${item.file ? `<a class="material-download" href="${escapeHtml(item.file)}">Unduh PowerPoint · ${escapeHtml(item.fileName || 'Buka materi')}</a>` : ''}
        ${item.href ? `<a class="material-download" href="${escapeHtml(item.href)}">${escapeHtml(item.action || 'Buka')}</a>` : ''}
      </div>
    `).join('') : `<div class="c"><p class="mu">Belum ada data.</p></div>`;

    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <b>${escapeHtml(title)}</b>
          <span class="user-meta">${escapeHtml(getRoleLabel(me.r))}</span>
        </header>
        <nav class="main-nav" aria-label="Navigasi utama">${navLinks(me.r)}${logoutNavButton()}</nav>
        <main class="page-main${page.includes('games') ? ' games-page-main' : ''}">
          <div class="page-heading">
            <h2>${escapeHtml(title)}</h2>
          </div>
          <div class="cards-grid">${cards}</div>
        </main>
      </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login.html';
    });
    document.querySelectorAll('[data-link]').forEach((button) => {
      button.addEventListener('click', () => {
        location.href = button.dataset.link;
      });
    });
  }

  function renderGamesPage(dataList, me) {
    const isEvening = page.includes('games malam');
    const isChild = me.r === 'c';
    let activeIndex = 0;
    const gameItems = dataList.map((item, index) => {
      const availableFor = item.classLabel || 'Kelas Sore & Malam';
      if (isChild) {
        return `
          <a class="child-game-card" href="${escapeHtml(item.href)}">
            <span class="child-game-art game-art ${escapeHtml(item.artwork)}" role="img" aria-label="${escapeHtml(item.artLabel || item.title)}">
              <span class="game-art-spark game-art-spark-one" aria-hidden="true">✦</span>
              <span class="game-art-spark game-art-spark-two" aria-hidden="true">✧</span>
              <span class="game-art-orbit game-art-orbit-one" aria-hidden="true"></span>
              <span class="game-art-orbit game-art-orbit-two" aria-hidden="true"></span>
              <span class="child-game-emoji" aria-hidden="true">${escapeHtml(item.artworkIcon || '🎮')}</span>
              <span class="child-game-art-caption">${escapeHtml(item.artLabel || 'Ayo bermain!')}</span>
            </span>
            <span class="child-game-card-copy">
              <span class="child-game-number">${escapeHtml(item.badge || `Game ${index + 1}`)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <span class="child-game-description">${escapeHtml(item.meta)}</span>
              <span class="child-game-launch">${escapeHtml(item.action || 'Mainkan game')} <span aria-hidden="true">→</span></span>
            </span>
          </a>
        `;
      }
      return `
        <button class="game-choice${index === activeIndex ? ' active' : ''}" type="button" data-game-index="${index}" aria-pressed="${index === activeIndex}">
          <span class="game-choice-icon ${escapeHtml(item.artwork)}" aria-hidden="true">${escapeHtml(item.artworkIcon || '🎮')}</span>
          <span class="game-choice-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.meta)}</span>
          </span>
          <span class="game-choice-tag">${availableFor}</span>
        </button>
      `;
    }).join('');

    root.innerHTML = `
      <div class="app-shell games-app-shell${isChild ? ' child-games-mode' : ' standard-games-mode'}">
        <aside class="games-sidebar">
          <a class="games-brand" href="/login.html">
            <img class="site-brand-logo" src="/assets/sipena-muhammadiyah-logo.png" alt="">
            <span>SIPENA</span>
          </a>
          <nav class="games-nav" aria-label="Navigasi utama">${navLinks(me.r)}</nav>
          <div class="games-sidebar-footer">
            <p>TPQ Calistung Nurfadillah</p>
            <button id="logout-btn" class="games-logout-button" type="button">Keluar</button>
          </div>
        </aside>
        <main class="games-workspace">
          <header class="games-topbar">
            <div class="games-topbar-title">
              <h1>Games & Kuis</h1>
              ${me.r === 'c' ? '' : `
                <nav class="games-class-tabs" aria-label="Pilih kelas">
                  <a class="${isEvening ? '' : 'active'}" href="/games%20sore.html" ${isEvening ? '' : 'aria-current="page"'}>Kelas Sore</a>
                  <a class="${isEvening ? 'active' : ''}" href="/games%20malam.html" ${isEvening ? 'aria-current="page"' : ''}>Kelas Malam</a>
                </nav>
              `}
            </div>
            <div class="games-topbar-meta">
              ${isChild ? '' : '<span class="games-score-note">Skor games tidak masuk nilai resmi</span>'}
              <span class="games-user">${escapeHtml(me.nama || getRoleLabel(me.r))}</span>
            </div>
          </header>
          ${isChild ? '' : `<section class="games-hero" aria-label="Belajar seru sambil bermain">
            <div class="games-hero-copy">
              <span class="games-hero-kicker">✨ Belajar seru bersama SIPENA</span>
              <h2>Petualangan dimulai di sini!</h2>
              <p>Pilih permainan favoritmu, kumpulkan pengalaman, dan belajar hal baru bersama teman.</p>
              <div class="games-hero-chips" aria-label="Manfaat bermain">
                <span>🎯 Tantangan seru</span>
                <span>📖 Belajar bersama</span>
              </div>
            </div>
            <div class="games-hero-art" aria-hidden="true">
              <span class="games-hero-star games-hero-star-one">✦</span>
              <span class="games-hero-star games-hero-star-two">✧</span>
              <img src="/assets/sipena-anak-pasangan.png" alt="">
            </div>
          </section>`}
          ${isChild ? `
            <section class="child-games-section" aria-label="Daftar permainan">
              <div class="games-section-heading">
                <span class="games-eyebrow">PILIH PERMAINAN</span>
                <h2>${dataList.length} games seru menantimu!</h2>
                <p>Pilih game favoritmu dan mulai petualangan belajar.</p>
              </div>
              <div class="child-games-grid">${gameItems}</div>
            </section>
          ` : `<section class="games-content" aria-label="Daftar dan detail games">
            <section class="games-choice-panel" aria-labelledby="games-choice-heading">
              <div class="games-section-heading">
                <span class="games-eyebrow">PILIH KEGIATAN</span>
                <h2 id="games-choice-heading">${dataList.length} games tersedia</h2>
                <p>Pilih salah satu kartu untuk melihat tujuan dan detail kegiatan.</p>
              </div>
              <div class="games-choice-list">${gameItems}</div>
            </section>
            <section class="games-detail-panel" id="game-detail-panel" aria-live="polite"></section>
          </section>`}
        </main>
      </div>
    `;

    document.querySelectorAll('.games-nav button').forEach((button) => {
      if (button.textContent.trim() === 'Games') button.classList.add('on');
    });

    const detailPanel = document.getElementById('game-detail-panel');
    const showGameDetails = (index) => {
      const item = dataList[index];
      detailPanel.innerHTML = `
        <div class="games-detail-header">
          <div>
            <span class="games-eyebrow">RINCIAN KEGIATAN</span>
            <h2>${escapeHtml(item.title)}</h2>
          </div>
          <span class="games-number-tag">${escapeHtml(item.badge || `Game ${index + 1}`)}</span>
        </div>
        <div class="games-preview ${escapeHtml(item.artwork)}" role="img" aria-label="${escapeHtml(item.artLabel || item.title)}">
          <span class="games-preview-orb games-preview-orb-one" aria-hidden="true"></span>
          <span class="games-preview-orb games-preview-orb-two" aria-hidden="true"></span>
          <span class="games-preview-icon" aria-hidden="true">${escapeHtml(item.artworkIcon || '🎮')}</span>
          <strong>${escapeHtml(item.artLabel || item.title)}</strong>
        </div>
        <div class="games-detail-copy">
          <div>
            <span class="games-eyebrow">TENTANG GAME</span>
            <p>${escapeHtml(item.meta)}</p>
          </div>
          <div class="games-detail-facts">
            <div><span>Jenis</span><strong>Belajar sambil bermain</strong></div>
            <div><span>Kelas</span><strong>${escapeHtml((item.classLabel || 'Kelas Sore & Malam').replace('Kelas ', ''))}</strong></div>
          </div>
          <div class="games-detail-note"><strong>Catatan:</strong> Skor permainan hanya untuk aktivitas belajar dan tidak masuk ke nilai resmi.</div>
          <a class="games-launch-button" href="${escapeHtml(item.href)}">${escapeHtml(item.action || 'Buka game')} <span aria-hidden="true">→</span></a>
        </div>
      `;
    };

    if (!isChild) {
      document.querySelectorAll('.game-choice').forEach((button) => {
        button.addEventListener('click', () => {
          activeIndex = Number(button.dataset.gameIndex);
          document.querySelectorAll('.game-choice').forEach((choice) => {
            const selected = choice === button;
            choice.classList.toggle('active', selected);
            choice.setAttribute('aria-pressed', String(selected));
          });
          showGameDetails(activeIndex);
        });
      });
      showGameDetails(activeIndex);
    }

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login.html';
    });
    document.querySelectorAll('[data-link]').forEach((button) => {
      button.addEventListener('click', () => {
        location.href = button.dataset.link;
      });
    });
  }

  function todayLocal() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function groupStudentsByClass(students) {
    const groups = [
      { key: 'sore', label: 'Kelas Sore', students: [] },
      { key: 'malam', label: 'Kelas Malam', students: [] },
    ];
    const knownGroups = new Map(groups.map((group) => [group.key, group]));
    const otherStudents = [];

    students.forEach((student) => {
      const classKey = String(student.k || '').trim().toLowerCase().replace(/^kelas\s+/, '');
      const group = knownGroups.get(classKey);
      if (group) group.students.push(student);
      else otherStudents.push(student);
    });

    if (otherStudents.length) {
      groups.push({ key: 'other', label: 'Kelas lainnya', students: otherStudents });
    }
    return groups;
  }

  function renderTeacherEntryPage(data, title, content) {
    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <b>${escapeHtml(title)}</b>
          <span class="user-meta">${escapeHtml(data.me?.nama || 'Ustadzah')}</span>
        </header>
        <nav class="main-nav" aria-label="Navigasi utama">${navLinks('u')}${logoutNavButton()}</nav>
        <main class="page-main">
          <div class="page-heading">
            <h2>${escapeHtml(title)}</h2>
            <p class="mu text-bubble">Kelola data pembelajaran SIPENA Muhammadiyah dengan mudah dan rapi.</p>
          </div>
          ${content}
        </main>
      </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login.html';
    });
    document.querySelectorAll('[data-link]').forEach((button) => {
      button.addEventListener('click', () => {
        location.href = button.dataset.link;
      });
    });
  }

  function bindDatabaseForm(formId, data, update) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      const feedback = form.querySelector('.form-feedback');
      button.disabled = true;
      button.textContent = 'Menyimpan...';
      feedback.textContent = '';
      try {
        const nextDb = Object.fromEntries(Object.entries(data.db).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.slice() : value,
        ]));
        update(nextDb, new FormData(form));
        const response = await fetch('/api/db', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextDb),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Data gagal disimpan.');
        await loadProtectedPage();
        const savedFeedback = root.querySelector('.form-feedback');
        if (savedFeedback) {
          savedFeedback.textContent = 'Data berhasil disimpan.';
          savedFeedback.classList.add('success');
        }
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Simpan';
        feedback.textContent = error.message || 'Terjadi kesalahan saat menyimpan data.';
        feedback.classList.remove('success');
      }
    });
  }

  function renderStudents(data) {
    const murid = data.db.m || [];
    const classSections = groupStudentsByClass(murid).map(({ label, students }) => {
      const rows = students.map((student) => `
        <tr>
          <td>${escapeHtml(student.no)}</td>
          <td>${escapeHtml(student.nama)}</td>
          <td>${escapeHtml(student.hp || '-')}</td>
          <td>${escapeHtml(student.st)}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">Belum ada murid di kelas ini.</td></tr>';
      return `
        <section class="student-class-section">
          <div class="dashboard-section-heading"><div><span class="section-eyebrow">Murid terdaftar</span><h3>${label} · ${students.length} murid</h3></div></div>
          <div class="w"><table><thead><tr><th>No.</th><th>Nama</th><th>HP wali</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
        </section>
      `;
    }).join('');
    renderTeacherEntryPage(data, 'Data Murid', `
      <section class="c entry-card">
        <div class="dashboard-section-heading">
          <div><span class="section-eyebrow">Data baru</span><h3>Tambah murid</h3></div>
        </div>
        <form id="student-form" class="entry-form">
          <div><label for="student-name">Nama murid</label><input id="student-name" name="nama" required maxlength="100" placeholder="Nama lengkap"></div>
          <div><label for="student-number">Nomor absen</label><input id="student-number" name="no" type="number" min="1" required placeholder="Contoh: 6"></div>
          <div><label for="student-class">Kelas</label><select id="student-class" name="kelas" required><option value="sore">Kelas Sore</option><option value="malam">Kelas Malam</option></select></div>
          <div><label for="guardian-phone">Nomor HP wali murid</label><input id="guardian-phone" name="hp" type="tel" autocomplete="tel" maxlength="30" placeholder="Contoh: 08xxxxxxxxxx"></div>
          <div class="entry-submit"><button class="p" type="submit">Simpan murid</button></div>
          <p class="form-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
      <section class="c">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Daftar terdaftar</span><h3>${murid.length} murid</h3></div></div>
        <div class="student-class-list">${classSections}</div>
      </section>
    `);
    bindDatabaseForm('student-form', data, (db, fields) => {
      db.m.push({
        id: newId('murid'),
        nama: String(fields.get('nama')).trim(),
        no: Number(fields.get('no')),
        k: fields.get('kelas'),
        hp: String(fields.get('hp') || '').trim(),
        st: 'aktif',
        masuk: todayLocal(),
      });
    });
  }

  function renderMaterials(data) {
    const materials = data.db.mt || [];
    const cards = materials.length ? materials.map((item) => `
      <article class="dashboard-material">
        <span class="material-subject">${escapeHtml(item.mp)}</span>
        <h4>${escapeHtml(item.j)}</h4>
        <p>${escapeHtml(item.i || 'File materi siap diunduh.')}</p>
        <span class="material-class">Kelas ${escapeHtml(item.k)}</span>
        ${item.file ? `<a class="material-download" href="${escapeHtml(item.file)}">Unduh PowerPoint · ${escapeHtml(item.fn || 'Buka materi')}</a>` : ''}
      </article>
    `).join('') : '<p class="mu dashboard-empty">Belum ada materi.</p>';
    renderTeacherEntryPage(data, 'Materi Pembelajaran', `
      <section class="c entry-card">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Unggah bahan belajar</span><h3>Tambahkan file PowerPoint</h3></div></div>
        <form id="material-form" class="entry-form">
          <div class="entry-wide"><label for="material-file">File presentasi (.ppt atau .pptx)</label><input id="material-file" name="file" type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" required><small class="input-hint">Pilih file PowerPoint yang sudah dibuat. Maksimal 25 MB.</small></div>
          <div><label for="material-title">Judul materi (opsional)</label><input id="material-title" name="judul" maxlength="150" placeholder="Otomatis memakai nama file"></div>
          <div><label for="material-subject">Mata pelajaran</label><input id="material-subject" name="mapel" maxlength="80" placeholder="Contoh: Iqra / Berhitung"></div>
          <div><label for="material-class">Kelas</label><select id="material-class" name="kelas"><option value="sore">Kelas Sore</option><option value="malam">Kelas Malam</option></select></div>
          <div class="entry-wide"><label for="material-content">Catatan untuk murid/wali (opsional)</label><textarea id="material-content" name="isi" rows="2" maxlength="2000" placeholder="Contoh: Pelajari slide 1–5 bersama orang tua."></textarea></div>
          <div class="entry-submit"><button class="p" type="submit">Unggah materi</button></div>
          <p class="form-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
      <section class="c">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Perpustakaan belajar</span><h3>${materials.length} materi</h3></div></div>
        <div class="dashboard-material-grid">${cards}</div>
      </section>
    `);
    const form = document.getElementById('material-form');
    const fileInput = document.getElementById('material-file');
    fileInput.addEventListener('change', () => {
      const titleInput = document.getElementById('material-title');
      if (!titleInput.value && fileInput.files[0]) {
        titleInput.value = fileInput.files[0].name.replace(/\.(pptx?)$/i, '');
      }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      const feedback = form.querySelector('.form-feedback');
      const file = fileInput.files[0];
      if (!file) {
        feedback.textContent = 'Pilih file PowerPoint terlebih dahulu.';
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        feedback.textContent = 'Ukuran file maksimal 25 MB.';
        return;
      }
      button.disabled = true;
      button.textContent = 'Mengunggah...';
      feedback.textContent = '';
      try {
        const response = await fetch('/api/materi/upload', {
          method: 'POST',
          body: new FormData(form),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'File materi gagal diunggah.');
        await loadProtectedPage();
        const savedFeedback = root.querySelector('.form-feedback');
        if (savedFeedback) {
          savedFeedback.textContent = 'File PowerPoint berhasil diunggah.';
          savedFeedback.classList.add('success');
        }
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Unggah materi';
        feedback.textContent = error.message || 'Terjadi kesalahan saat mengunggah file.';
        feedback.classList.remove('success');
      }
    });
  }

  function renderAchievements(data, selectedClass = 'sore') {
    const murid = data.db.m || [];
    const students = murid.filter((student) => student.k === selectedClass);
    const studentsById = new Map(murid.map((student) => [student.id, student]));
    const achievements = (data.db.c || [])
      .filter((item) => (item.k || studentsById.get(item.m)?.k) === selectedClass)
      .sort((a, b) => String(b.t || '').localeCompare(String(a.t || '')));
    const rows = achievements.map((item) => {
      const student = studentsById.get(item.m);
      return `<tr><td>${escapeHtml(student?.nama || 'Murid')}</td><td>${escapeHtml(item.t)}</td><td>${escapeHtml(item.j)}</td><td>${escapeHtml(item.h)}</td><td>${item.l ? 'Tuntas' : 'Proses'}</td></tr>`;
    }).join('') || `<tr><td colspan="5">Belum ada catatan capaian kelas ${selectedClass}.</td></tr>`;
    const studentOptions = students.map((student) =>
      `<option value="${escapeHtml(student.id)}">${escapeHtml(student.nama)}</option>`
    ).join('');
    const classLabel = selectedClass === 'malam' ? 'Malam' : 'Sore';
    renderTeacherEntryPage(data, 'Capaian Belajar', `
      <nav class="achievement-class-tabs" aria-label="Pilih kelas capaian" role="tablist">
        <button type="button" class="achievement-class-tab${selectedClass === 'sore' ? ' active' : ''}" role="tab" aria-selected="${selectedClass === 'sore'}" data-achievement-class="sore">Kelas Sore</button>
        <button type="button" class="achievement-class-tab${selectedClass === 'malam' ? ' active' : ''}" role="tab" aria-selected="${selectedClass === 'malam'}" data-achievement-class="malam">Kelas Malam</button>
      </nav>
      <section class="c entry-card">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Perkembangan murid · Kelas ${classLabel}</span><h3>Tambah capaian</h3></div></div>
        <form id="achievement-form" class="entry-form">
          <div><label for="achievement-student">Nama murid</label><select id="achievement-student" name="murid" required ${students.length ? '' : 'disabled'}>${studentOptions || '<option value="">Belum ada murid di kelas ini</option>'}</select></div>
          <div><label for="achievement-date">Tanggal</label><input id="achievement-date" name="tanggal" type="date" value="${todayLocal()}" required></div>
          <div><label for="achievement-level">Jilid / juz</label><input id="achievement-level" name="jilid" type="number" min="1" required></div>
          <div><label for="achievement-page">Halaman</label><input id="achievement-page" name="halaman" type="number" min="1" required></div>
          <div><label for="achievement-result">Hasil belajar</label><select id="achievement-result" name="hasil"><option>Lanjut</option><option>Ulang</option><option>Baik</option></select></div>
          <div><label for="achievement-surah">Surah (opsional)</label><input id="achievement-surah" name="surah" maxlength="100" placeholder="Nama surah"></div>
          <div class="entry-wide"><label for="achievement-note">Catatan ustadzah</label><textarea id="achievement-note" name="catatan" rows="2" placeholder="Catatan singkat perkembangan murid"></textarea></div>
          <label class="check-field"><input name="lulus" type="checkbox"> Tandai capaian ini tuntas</label>
          <div class="entry-submit"><button class="p" type="submit">Simpan capaian</button></div>
          <p class="form-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
      <section class="c">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Riwayat belajar · Kelas ${classLabel}</span><h3>Catatan capaian</h3></div></div>
        <div class="w"><table><thead><tr><th>Murid</th><th>Tanggal</th><th>Jilid/Juz</th><th>Halaman</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>
    `);
    document.querySelectorAll('[data-achievement-class]').forEach((button) => {
      button.addEventListener('click', () => renderAchievements(data, button.dataset.achievementClass));
    });
    bindDatabaseForm('achievement-form', data, (db, fields) => {
      const student = students.find((entry) => entry.id === fields.get('murid'));
      if (!student) return;
      db.c.push({
        id: newId('capaian'),
        m: fields.get('murid'),
        t: fields.get('tanggal'),
        k: selectedClass,
        j: Number(fields.get('jilid')),
        h: Number(fields.get('halaman')),
        hs: fields.get('hasil'),
        l: fields.get('lulus') === 'on' ? 1 : 0,
        s: String(fields.get('surah') || '').trim(),
        bc: 0,
        tl: 0,
        hg: 0,
        n: String(fields.get('catatan') || '').trim(),
      });
    });
  }

  function renderTasks(data) {
    const murid = data.db.m || [];
    const tasks = data.db.t || [];
    const grades = data.db.n || [];
    const taskRows = tasks.map((task) => `<tr><td>${escapeHtml(task.j)}</td><td>${escapeHtml(task.k)}</td><td>${escapeHtml(task.t || '-')}</td></tr>`).join('')
      || '<tr><td colspan="3">Belum ada tugas.</td></tr>';
    const gradeRows = grades.map((grade) => {
      const student = murid.find((entry) => entry.id === grade.m);
      const task = tasks.find((entry) => entry.id === grade.t);
      return `<tr><td>${escapeHtml(student?.nama || 'Murid')}</td><td>${escapeHtml(task?.j || 'Tugas')}</td><td>${escapeHtml(grade.v)}</td></tr>`;
    }).join('') || '<tr><td colspan="3">Belum ada nilai.</td></tr>';
    const gradeForm = tasks.length && murid.length ? `
      <section class="c entry-card">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Evaluasi murid</span><h3>Input nilai</h3></div></div>
        <form id="grade-form" class="entry-form">
          <div><label for="grade-student">Nama murid</label><select id="grade-student" name="murid">${murid.map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.nama)}</option>`).join('')}</select></div>
          <div><label for="grade-task">Tugas</label><select id="grade-task" name="tugas">${tasks.map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.j)}</option>`).join('')}</select></div>
          <div><label for="grade-value">Nilai (0–100)</label><input id="grade-value" name="nilai" type="number" min="0" max="100" step="0.1" required></div>
          <div class="entry-submit"><button class="p" type="submit">Simpan nilai</button></div>
          <p class="form-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
    ` : '';
    renderTeacherEntryPage(data, 'Tugas & Nilai', `
      <section class="c entry-card">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Agenda belajar</span><h3>Tambah tugas</h3></div></div>
        <form id="task-form" class="entry-form">
          <div><label for="task-title">Judul tugas</label><input id="task-title" name="judul" required maxlength="150" placeholder="Contoh: Latihan membaca halaman 5"></div>
          <div><label for="task-class">Kelas</label><select id="task-class" name="kelas"><option value="sore">Kelas Sore</option><option value="malam">Kelas Malam</option></select></div>
          <div><label for="task-date">Batas / tanggal tugas</label><input id="task-date" name="tanggal" type="date"></div>
          <div class="entry-submit"><button class="p" type="submit">Simpan tugas</button></div>
          <p class="form-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
      <section class="c">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Daftar pembelajaran</span><h3>Tugas tersimpan</h3></div></div>
        <div class="w"><table><thead><tr><th>Judul</th><th>Kelas</th><th>Tanggal</th></tr></thead><tbody>${taskRows}</tbody></table></div>
      </section>
      ${gradeForm}
      <section class="c">
        <div class="dashboard-section-heading"><div><span class="section-eyebrow">Hasil evaluasi</span><h3>Nilai murid</h3></div></div>
        <div class="w"><table><thead><tr><th>Murid</th><th>Tugas</th><th>Nilai</th></tr></thead><tbody>${gradeRows}</tbody></table></div>
      </section>
    `);
    bindDatabaseForm('task-form', data, (db, fields) => {
      db.t.push({
        id: newId('tugas'),
        j: String(fields.get('judul')).trim(),
        k: fields.get('kelas'),
        t: fields.get('tanggal') || '',
      });
    });
    bindDatabaseForm('grade-form', data, (db, fields) => {
      db.n = db.n.filter((grade) => !(grade.m === fields.get('murid') && grade.t === fields.get('tugas')));
      db.n.push({ m: fields.get('murid'), t: fields.get('tugas'), v: Number(fields.get('nilai')) });
    });
  }

  async function renderAdminPanel(data) {
    const settings = data.db.settings || { primary: '#8ecae6', secondary: '#4076d1', cover: false };
    let students = [];
    try {
      const response = await fetch('/api/admin/murid');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Daftar akun wali tidak dapat dimuat.');
      students = payload.murid || [];
    } catch (error) {
      console.error(error);
      location.href = '/login.html';
      return;
    }

    const rows = students.map((student) => `
      <tr>
        <td>${escapeHtml(student.nama)}<small class="admin-subtext">Absen ${escapeHtml(student.no)}</small></td>
        <td>${escapeHtml(student.kelas)}</td>
        <td>${student.hp ? `<a href="tel:${escapeHtml(student.hp)}">${escapeHtml(student.hp)}</a>` : 'Belum diisi'}</td>
        <td data-password-status="${escapeHtml(student.id)}">${escapeHtml(student.password_status)}</td>
        <td>
          <button class="section-link reset-password-button" type="button" data-reset-password="${escapeHtml(student.id)}">Reset sandi</button>
          <p class="form-feedback reset-feedback" data-reset-feedback="${escapeHtml(student.id)}" role="status" aria-live="polite"></p>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5">Belum ada akun wali murid.</td></tr>';

    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <b>Pengaturan Admin</b>
          <span class="user-meta">Admin</span>
        </header>
        <nav class="main-nav" aria-label="Navigasi utama">${navLinks('a')}${logoutNavButton()}</nav>
        <main class="page-main">
          <div class="page-heading">
            <span class="hero-badge">Pusat kendali</span>
            <h2>Pengaturan Admin</h2>
            <p class="mu text-bubble">Atur nuansa warna dan foto sampul, lalu pantau informasi akun wali murid SIPENA Muhammadiyah.</p>
          </div>
          <div class="admin-settings-grid">
            <section class="c">
              <div class="dashboard-section-heading"><div><span class="section-eyebrow">Identitas visual</span><h3>Warna dashboard</h3></div></div>
              <form id="theme-form" class="admin-theme-form">
                <label class="color-setting"><span>Warna utama</span><input type="color" name="primary" value="${escapeHtml(settings.primary)}"></label>
                <label class="color-setting"><span>Warna aksen</span><input type="color" name="secondary" value="${escapeHtml(settings.secondary)}"></label>
                <button class="p" type="submit">Simpan warna</button>
                <p class="form-feedback" role="status" aria-live="polite"></p>
              </form>
            </section>
            <section class="c">
              <div class="dashboard-section-heading"><div><span class="section-eyebrow">Halaman cover</span><h3>Foto sampul / wallpaper</h3></div></div>
              <div class="cover-preview ${settings.cover ? 'has-cover' : ''}" id="cover-preview">
                ${settings.cover ? '<img src="/api/cover" alt="Foto sampul saat ini">' : '<span>Belum ada foto sampul</span>'}
              </div>
              <form id="cover-form" class="cover-upload-form">
                <label for="cover-file">Pilih foto JPG, PNG, atau WEBP</label>
                <input id="cover-file" name="file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required>
                <small class="input-hint">Maksimal 8 MB. Foto ditampilkan pada halaman cover/login.</small>
                <button class="p" type="submit">Unggah foto cover</button>
                <p class="form-feedback" role="status" aria-live="polite"></p>
              </form>
            </section>
          </div>
          <section class="c" id="wali-akun">
            <div class="dashboard-section-heading">
              <div><span class="section-eyebrow">Data kontak keluarga</span><h3>Akun wali murid</h3></div>
              <span class="section-date">${students.length} akun</span>
            </div>
            <p class="mu admin-password-note">Password lama tidak ditampilkan. Jika wali lupa, reset sandi untuk membuat password sementara baru.</p>
            <div class="w">
              <table class="admin-accounts-table">
                <thead><tr><th>Nama murid</th><th>Kelas</th><th>Nomor HP wali</th><th>Status sandi</th><th>Aksi</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login.html';
    });

    const themeForm = document.getElementById('theme-form');
    themeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = themeForm.querySelector('[type="submit"]');
      const feedback = themeForm.querySelector('.form-feedback');
      button.disabled = true;
      feedback.textContent = '';
      try {
        const response = await fetch('/api/admin/pengaturan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(themeForm))),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Warna gagal disimpan.');
        applySettings(payload);
        feedback.textContent = 'Warna berhasil disimpan.';
        feedback.classList.add('success');
      } catch (error) {
        feedback.textContent = error.message || 'Warna gagal disimpan.';
        feedback.classList.remove('success');
      } finally {
        button.disabled = false;
      }
    });

    const coverForm = document.getElementById('cover-form');
    coverForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = coverForm.querySelector('[type="submit"]');
      const feedback = coverForm.querySelector('.form-feedback');
      const file = document.getElementById('cover-file').files[0];
      if (!file) {
        feedback.textContent = 'Pilih foto cover terlebih dahulu.';
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        feedback.textContent = 'Ukuran foto maksimal 8 MB.';
        return;
      }
      button.disabled = true;
      feedback.textContent = '';
      try {
        const response = await fetch('/api/admin/cover', { method: 'POST', body: new FormData(coverForm) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Foto cover gagal diunggah.');
        applySettings({ ...settings, cover: true });
        const preview = document.getElementById('cover-preview');
        preview.classList.add('has-cover');
        preview.innerHTML = `<img src="/api/cover?v=${Date.now()}" alt="Foto sampul baru">`;
        feedback.textContent = 'Foto cover berhasil diperbarui.';
        feedback.classList.add('success');
      } catch (error) {
        feedback.textContent = error.message || 'Foto cover gagal diunggah.';
        feedback.classList.remove('success');
      } finally {
        button.disabled = false;
      }
    });

    document.querySelectorAll('[data-reset-password]').forEach((button) => {
      button.addEventListener('click', async () => {
        const studentId = button.dataset.resetPassword;
        const feedback = document.querySelector(`[data-reset-feedback="${studentId}"]`);
        if (!confirm('Buat password sementara baru untuk wali murid ini?')) return;
        button.disabled = true;
        feedback.textContent = '';
        try {
          const response = await fetch(`/api/admin/murid/${encodeURIComponent(studentId)}/reset-password`, { method: 'POST' });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || 'Password gagal direset.');
          document.querySelector(`[data-password-status="${studentId}"]`).textContent = 'Sandi sementara baru';
          feedback.textContent = `Password sementara (catat dan berikan ke wali): ${payload.temporary_password}`;
          feedback.classList.add('success');
        } catch (error) {
          feedback.textContent = error.message || 'Password gagal direset.';
          feedback.classList.remove('success');
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  function renderAttendance(data) {
    const me = data.me || {};
    const murid = (data.db.m || []).filter((student) => student.st === 'aktif');
    const today = todayLocal();
    const classSections = groupStudentsByClass(murid).map(({ label, students }) => {
      const rows = students.map((student) => {
        const status = (data.db.a || []).find((item) => item.m === student.id && item.t === today)?.s || 'Hadir';
        return `
          <tr>
            <td>${escapeHtml(student.no ?? student.id)}. ${escapeHtml(student.nama)}</td>
            <td>
              <select data-attendance-student="${escapeHtml(student.id)}">
                ${['Hadir', 'Izin', 'Sakit', 'Alpa'].map((option) => `<option value="${option}" ${option === status ? 'selected' : ''}>${option}</option>`).join('')}
              </select>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="2">Belum ada murid aktif di kelas ini.</td></tr>';
      return `
        <section class="attendance-class-section">
          <div class="dashboard-section-heading"><div><span class="section-eyebrow">Presensi kelas</span><h3>${label} · ${students.length} murid</h3></div></div>
          <div class="w">
            <table>
              <thead><tr><th>Murid</th><th>Status kehadiran</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    }).join('');

    renderTeacherEntryPage(data, 'Absensi', `
          <section class="c entry-card">
            <div class="dashboard-section-heading"><div><span class="section-eyebrow">Presensi kelas</span><h3>Input kehadiran harian</h3></div></div>
            <form id="attendance-form">
              <div class="r inline-form">
                <div><label for="attendance-date">Tanggal</label><input id="attendance-date" type="date" name="tanggal" value="${today}" required></div>
              </div>
            <div class="attendance-class-list">${classSections}</div>
              <div class="entry-submit"><button class="p" type="submit">Simpan absensi</button></div>
              <p class="form-feedback" role="status" aria-live="polite"></p>
            </form>
          </section>
    `);
    bindDatabaseForm('attendance-form', data, (db, fields) => {
      const date = fields.get('tanggal');
      const selected = new Map(Array.from(document.querySelectorAll('[data-attendance-student]'), (select) => [
        select.dataset.attendanceStudent,
        select.value,
      ]));
      db.a = db.a.filter((item) => item.t !== date || !selected.has(item.m));
      selected.forEach((status, studentId) => db.a.push({ m: studentId, t: date, s: status }));
    });
  }

  function renderPasswordForm(data) {
    const me = data.me || {};
    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <b>Ganti Sandi</b>
          <span class="user-meta">${escapeHtml(getRoleLabel(me.r))}</span>
        </header>
        <nav class="main-nav" aria-label="Navigasi utama">${navLinks(me.r)}${logoutNavButton()}</nav>
        <main class="page-main">
          <div class="page-heading">
            <h2>Ganti Sandi</h2>
          </div>
          <div class="c auth-card form-box">
            <form id="pass-form" class="stacked-form">
              <div>
                <label>Password baru</label>
                <input id="new-pass" type="password" required>
              </div>
              <div>
                <label>Konfirmasi password</label>
                <input id="new-pass-confirm" type="password" required>
              </div>
              <button class="p" type="submit">Simpan</button>
            </form>
          </div>
        </main>
      </div>
    `;

    document.getElementById('pass-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const p = document.getElementById('new-pass').value;
      const q = document.getElementById('new-pass-confirm').value;
      if (p.length < 4 || p !== q) {
        alert('Password minimal 4 karakter dan konfirmasi harus sama.');
        return;
      }
      const resp = await fetch('/api/ganti-sandi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p })
      });
      const payload = await resp.json().catch(() => ({}));
      alert(resp.ok ? 'Sandi berhasil diperbarui.' : (payload.error || 'Gagal update sandi'));
      if (resp.ok) location.href = '/dashbord%20walimurid.html';
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login.html';
    });
    document.querySelectorAll('[data-link]').forEach((button) => {
      button.addEventListener('click', () => {
        location.href = button.dataset.link;
      });
    });
  }

  async function loadProtectedPage() {
    const response = await fetch('/api/db', { credentials: 'same-origin' });
    if (!response.ok) {
      location.href = '/login.html';
      return;
    }
    const data = await response.json();
    window.__tpqMe = data.me || {};

    if (data.me?.r === 'c') {
      const childGamesPage = data.me.k === 'malam' ? 'games malam' : 'games sore';
      if (!page.includes(childGamesPage)) {
        location.replace(data.me.k === 'malam' ? '/games%20malam.html' : '/games%20sore.html');
        return;
      }
    }

    if (page.includes('absensi')) {
      renderAttendance(data);
      return;
    }
    if (page.includes('wali') && page.includes('sandi')) {
      renderPasswordForm(data);
      return;
    }

    if (page.includes('admin-panel')) {
      if (data.me?.r !== 'a') {
        location.href = '/login.html';
        return;
      }
      await renderAdminPanel(data);
      return;
    }

    if (page.includes('dashbord')) {
      renderDashboard(data);
      return;
    }

    if (page.includes('materi')) {
      if (data.me?.r === 'u') {
        renderMaterials(data);
        return;
      }
      const list = (data.db.mt || []).map((item) => ({
        title: item.j,
        meta: `${item.mp || 'Materi'} • ${item.k || '-'}`,
        status: 'Aktif',
        file: item.file,
        fileName: item.fn,
      }));
      renderGenericList('Materi', list, 'Materi');
      return;
    }

    if (page.includes('tugas')) {
      if (data.me?.r === 'u') {
        renderTasks(data);
        return;
      }
      const list = (data.db.t || []).map((item) => ({
        title: item.j,
        meta: `${item.k || '-'} • ${item.t || '-'}`,
        status: 'Terjadwal',
      }));
      renderGenericList('Tugas & Nilai', list, 'Tugas');
      return;
    }

    if (page.includes('capaian')) {
      if (data.me?.r === 'u') {
        renderAchievements(data);
        return;
      }
      const list = (data.db.c || []).map((item) => ({
        title: item.m || 'Murid',
        meta: `Jilid/Juz ${item.j || '-'} • Hal ${item.h || '-'}`,
        status: item.l ? 'Lulus' : 'Proses',
      }));
      renderGenericList('Capaian', list, 'Capaian');
      return;
    }

    if (page.includes('laporan')) {
      const list = [
        { title: 'Rekap kehadiran', meta: 'Hari ini', badge: 'Aktif' },
        { title: 'Progress murid', meta: 'Per kelas', badge: 'Update' },
        { title: 'Nilai tugas', meta: 'Rata-rata', badge: 'Baru' },
      ];
      renderGenericList('Laporan', list, 'Ringkasan');
      return;
    }

    if (page.includes('games')) {
      const list = [
        {
          title: 'Tebak Kartu',
          meta: 'Pilih kartu, jawab soal, dan kumpulkan poin. Bisa dimainkan untuk kelas sore maupun malam.',
          badge: 'Game 1',
          classLabel: 'Kelas Sore & Malam',
          artwork: 'game-art-cards',
          artworkIcon: '🎴',
          artLabel: 'Buka kartu, temukan soal!',
          href: '/games/tebak-kartu/index.html',
          action: 'Mainkan Tebak Kartu',
        },
        {
          title: 'Roda Keberuntungan',
          meta: 'Putar roda untuk memilih tantangan agama, lalu kumpulkan poin bersama teman. Tersedia untuk kelas sore dan malam.',
          badge: 'Game 2',
          classLabel: 'Kelas Sore & Malam',
          artwork: 'game-art-wheel',
          artworkIcon: '🎡',
          artLabel: 'Putar roda keberuntungan!',
          href: '/games/roda-berputar/index.html',
          action: 'Mainkan Roda Keberuntungan',
        },
      ];
      if (page.includes('games sore')) {
        list.push({
          title: 'Petualangan Huruf Hijaiyah',
          meta: 'Kenali bentuk 28 huruf hijaiyah, dengarkan bunyinya, dan bedakan huruf yang mirip lewat 3 level.',
          badge: 'Game 3',
          classLabel: 'Kelas Sore',
          artwork: 'game-art-hijaiyah',
          artworkIcon: '🐰',
          artLabel: 'Ayo bertualang mengenal huruf!',
          href: '/games/petualangan-huruf-hijaiyah/index.html',
          action: 'Mainkan Petualangan Hijaiyah',
        });
      }
      list.push({
        title: 'Sambung Ayat Challenge',
        meta: 'Latihan menyambung dan melengkapi ayat Juz 30 dengan mode individu atau kelompok.',
        badge: page.includes('games sore') ? 'Game 4' : 'Game 3',
        classLabel: 'Kelas Sore & Malam',
        artwork: 'game-art-ayat',
        artworkIcon: '📖',
        artLabel: 'Susun ayat bersama!',
        href: '/games/sambung-ayat-challenge/index.html?kelas=' + (page.includes('games malam') ? 'malam' : 'sore'),
        action: 'Mainkan Sambung Ayat',
      });
      list.push({
        title: 'Detektif Tajwid',
        meta: 'Selidiki hukum nun sukun dan tanwin dengan pilihan soal sesuai tingkat kelas.',
        badge: page.includes('games sore') ? 'Game 5' : 'Game 4',
        classLabel: 'Kelas Sore & Malam',
        artwork: 'game-art-tajwid',
        artworkIcon: '🕵️',
        artLabel: 'Temukan petunjuk tajwid!',
        href: '/games/detektif-tajwid/index.html?kelas=' + (page.includes('games malam') ? 'malam' : 'sore'),
        action: 'Mulai Penyelidikan',
      });
      renderGamesPage(list, data.me || { r: 'u' });
      return;
    }

    if (page.includes('akun')) {
      const students = data.db.m || [];
      const rows = students.map((student) => `
        <tr>
          <td>${escapeHtml(student.nama)}</td>
          <td>${student.gp ? 'Sudah diganti' : student.pass != null ? escapeHtml(student.pass) : 'Atur oleh admin'}</td>
          <td>${escapeHtml(student.no ?? '-')}</td>
          <td>${escapeHtml(student.k || '-')}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">Belum ada akun wali murid. Tambahkan murid terlebih dahulu.</td></tr>';
      renderTeacherEntryPage(data, 'Akun Wali Murid', `
        <section class="c">
          <p class="mu">Username wali adalah nama murid. Password awal mengikuti nomor absen. Berikan data login hanya kepada wali murid yang bersangkutan.</p>
          <div class="w">
            <table>
              <thead><tr><th>Username</th><th>Password</th><th>No. absen</th><th>Kelas</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `);
      return;
    }

    if (page.includes('data')) {
      if (data.me?.r === 'u') {
        renderStudents(data);
        return;
      }
      renderDashboard(data);
      return;
    }

    renderDashboard(data);
  }

  if (page.includes('login') || page === 'admin.html') {
    renderLogin();
    return;
  }

  loadProtectedPage();
})();
