// ============ THEME ============
(function theme() {
  const btn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  function applyTheme(mode) {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      icon.textContent = '☀';
      label.textContent = 'Mode clair';
    } else {
      document.documentElement.removeAttribute('data-theme');
      icon.textContent = '☾';
      label.textContent = 'Mode sombre';
    }
  }
})();

// ============ MOBILE TOC ============
(function toc() {
  const toggle = document.getElementById('toc-toggle');
  const sidebar = document.getElementById('sidebar');
  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  sidebar.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => sidebar.classList.remove('open'));
  });
})();

// ============ REVEAL ON SCROLL (+ portrait scan) ============
(function reveal() {
  const items = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(el => observer.observe(el));
})();

// ============ COPY CONTACT BLOCK ============
(function copy() {
  const btn = document.getElementById('copy-btn');
  const code = document.getElementById('contact-code');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      const original = btn.textContent;
      btn.textContent = 'copié ✓';
      setTimeout(() => { btn.textContent = original; }, 1600);
    } catch (e) {
      btn.textContent = 'erreur';
    }
  });
})();

// ============ CONTACT FORM: stars + drag&drop + upload + emailjs ============
(function messageForm() {
  const CLOUD_NAME = 'dqtu9carq';
  const UPLOAD_PRESET = 'temoignages_ikyeshero';
  const EMAILJS_PUBLIC_KEY = 'AGXhkUZPEkhm_AIZ6';
  const EMAILJS_SERVICE_ID = 'service_yg1i99u';
  const EMAILJS_TEMPLATE_ID = 'template_ub1vmel';

  if (window.emailjs) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  const form = document.getElementById('message-form');
  if (!form) return;

  const starsWrap = document.getElementById('stars');
  const stars = Array.from(starsWrap.querySelectorAll('.star'));
  const noteInput = document.getElementById('f-note');
  let currentNote = 0;

  function paintStars(value) {
    stars.forEach(s => {
      const v = Number(s.dataset.value);
      s.classList.toggle('filled', v <= value);
      s.setAttribute('aria-checked', v === value ? 'true' : 'false');
    });
  }
  stars.forEach(s => {
    s.addEventListener('click', () => {
      currentNote = Number(s.dataset.value);
      noteInput.value = currentNote;
      paintStars(currentNote);
    });
    s.addEventListener('mouseenter', () => paintStars(Number(s.dataset.value)));
  });
  starsWrap.addEventListener('mouseleave', () => paintStars(currentNote));

  // ---- Dropzone ----
  const dropzone = document.getElementById('dropzone');
  const dzInner = document.getElementById('dropzone-inner');
  const dzPreview = document.getElementById('dropzone-preview');
  const fileInput = document.getElementById('f-photo');
  let selectedFile = null;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); });
  });
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  function setFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      dzPreview.src = e.target.result;
      dzPreview.hidden = false;
      dzInner.hidden = true;
    };
    reader.readAsDataURL(file);
  }

  // ---- Console output ----
  const consoleOut = document.getElementById('console-out');
  function log(msg, type) {
    consoleOut.classList.add('open');
    const p = document.createElement('p');
    p.className = type ? 'console-line-' + type : '';
    p.textContent = msg;
    consoleOut.appendChild(p);
    consoleOut.scrollTop = consoleOut.scrollHeight;
  }
  function resetConsole() {
    consoleOut.innerHTML = '';
    consoleOut.classList.remove('open');
  }

  // ---- Submit ----
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetConsole();

    const nom = document.getElementById('f-nom').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const temoignage = document.getElementById('f-message').value.trim();
    const note = Number(noteInput.value);

    if (!nom || !email || !temoignage || !note || !selectedFile) {
      log('$ erreur — merci de remplir tous les champs (y compris la note et la photo)', 'err');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'envoi_en_cours...';

    try {
      log('$ upload_photo(' + selectedFile.name + ')', 'info');
      const photoUrl = await uploadToCloudinary(selectedFile);
      log('✓ photo uploadée', 'ok');

      log('$ emailjs.send(nom, email, note, temoignage, photo_url)', 'info');
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        nom: nom,
        email: email,
        note: note,
        temoignage: temoignage,
        photo_url: photoUrl
      });
      log('✓ message envoyé — merci ' + nom + ' !', 'ok');

      form.reset();
      currentNote = 0;
      paintStars(0);
      dzPreview.hidden = true;
      dzInner.hidden = false;
      selectedFile = null;
    } catch (err) {
      console.error(err);
      log('✗ une erreur est survenue, réessaie dans un instant', 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'envoyer_message()';
    }
  });

  function uploadToCloudinary(file) {
    const url = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    return fetch(url, { method: 'POST', body: formData })
      .then(res => {
        if (!res.ok) throw new Error('Échec upload Cloudinary');
        return res.json();
      })
      .then(data => data.secure_url);
  }
})();
