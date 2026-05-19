/* Three Paper Masks — main.js */

/* ── CRT power-on animation (index page, first visit only) ── */
(function () {
  const overlay = document.getElementById('crt-overlay');
  if (!overlay) return;

  if (localStorage.getItem('tpm-seen')) {
    overlay.style.display = 'none';
    return;
  }

  const line = document.getElementById('crt-line');

  setTimeout(() => {
    line.classList.add('expand');

    setTimeout(() => {
      let flashes = 0;
      const flash = setInterval(() => {
        overlay.style.opacity = flashes % 2 === 0 ? '0.7' : '1';
        flashes++;
        if (flashes >= 6) {
          clearInterval(flash);
          overlay.style.opacity = '1';
          setTimeout(() => {
            overlay.classList.add('hidden');
            setTimeout(() => {
              overlay.style.display = 'none';
              localStorage.setItem('tpm-seen', '1');
            }, 700);
          }, 100);
        }
      }, 50);
    }, 400);
  }, 200);
}());

/* ── Ambient audio ────────────────────────────────────────── */
(function () {
  const audio  = document.getElementById('ambient');
  const toggle = document.getElementById('audio-toggle');
  const cta    = document.getElementById('audio-cta');

  if (!audio || !toggle) return;

  audio.volume = 0.25;

  function setOn(on) {
    if (on) {
      audio.play().then(() => {
        sessionStorage.setItem('audio-on', 'true');
        toggle.classList.add('on');
        toggle.setAttribute('aria-label', 'Mute ambient audio');
        if (cta) cta.classList.add('dismissed');
      }).catch(() => { /* autoplay blocked — CTA or toggle remains for manual start */ });
    } else {
      audio.pause();
      sessionStorage.setItem('audio-on', 'false');
      toggle.classList.remove('on');
      toggle.setAttribute('aria-label', 'Unmute ambient audio');
    }
  }

  /* Resume across page navigations if user had audio on */
  if (sessionStorage.getItem('audio-on') === 'true') setOn(true);

  if (cta) cta.addEventListener('click', () => setOn(true));

  toggle.addEventListener('click', () => {
    audio.paused ? setOn(true) : setOn(false);
  });
}());

/* ── Transmissions form ───────────────────────────────────── */
(function () {
  const form = document.getElementById('tpm-transmit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch('/api/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      form.querySelectorAll('.tpm-field, .tpm-submit').forEach(el => el.hidden = true);
      form.querySelector('.tpm-confirm').hidden = false;
    } catch {
      form.querySelector('.tpm-error').hidden = false;
    }
  });
}());

/* ── Lazy-load chapter videos ────────────────────────────── */
(function () {
  if (!('IntersectionObserver' in window)) return;

  const videos = document.querySelectorAll('video[data-src]');
  if (!videos.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const v = entry.target;
      if (v.dataset.src) { v.src = v.dataset.src; v.removeAttribute('data-src'); }
      observer.unobserve(v);
    });
  }, { rootMargin: '200px' });

  videos.forEach(v => observer.observe(v));
}());

/* ── Drifting rabbit mask ─────────────────────────────────── */
(function () {
  const rabbit = document.querySelector('.rabbit-drift');
  if (!rabbit) return;

  function driftOnce() {
    const top      = window.innerHeight * (0.2 + Math.random() * 0.6);
    const duration = 25000 + Math.random() * 20000;
    const fromLeft = Math.random() > 0.5;

    rabbit.style.transition = 'none';
    rabbit.style.top        = `${top}px`;
    rabbit.style.left       = fromLeft ? '-100px' : 'calc(100vw + 100px)';
    rabbit.style.transform  = 'none';
    rabbit.style.opacity    = '';  /* clear inline opacity so class controls it */
    rabbit.offsetHeight;           /* force reflow */

    rabbit.style.transition = `transform ${duration}ms linear, opacity 3s ease`;
    rabbit.classList.add('drifting');
    rabbit.style.transform = fromLeft
      ? 'translateX(calc(100vw + 200px))'
      : 'translateX(calc(-100vw - 200px))';

    setTimeout(() => { rabbit.style.opacity = '0'; }, duration - 3000);
    setTimeout(() => { rabbit.classList.remove('drifting'); }, duration);
  }

  function scheduleDrift() {
    const wait = 30000 + Math.random() * 60000;
    setTimeout(() => { driftOnce(); scheduleDrift(); }, wait);
  }

  setTimeout(scheduleDrift, 15000);
}());

/* ── Custom cursor (desktop/mouse only) ──────────────────── */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.querySelector('.cursor');
  if (!cursor) return;

  let cx = -100, cy = -100;
  let tx = -100, ty = -100;
  let rafId = null;

  document.addEventListener('mousemove', e => {
    tx = e.clientX;
    ty = e.clientY;
    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  document.addEventListener('mouseleave', () => {
    tx = cx - 200;
    ty = cy - 200;
  });

  function tick() {
    rafId = null;
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
      rafId = requestAnimationFrame(tick);
    }
  }

  document.querySelectorAll('a, button, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}());
