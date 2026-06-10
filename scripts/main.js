/* Three Paper Masks — main.js */

/* ── Mobile broadcast intro (first visit, mobile only) ──────── */
(function () {
  const intro = document.getElementById('mobile-intro');
  if (!intro) return;

  setTimeout(() => {
    intro.classList.add('fadeout');
    setTimeout(() => {
      intro.remove();
      localStorage.setItem('tpm-tuned-in', 'true');
      localStorage.setItem('tpm-seen', '1');
    }, 900);
  }, 2800);
}());

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
      }).catch(() => {});
    } else {
      audio.pause();
      sessionStorage.setItem('audio-on', 'false');
      toggle.classList.remove('on');
      toggle.setAttribute('aria-label', 'Unmute ambient audio');
    }
  }

  /* Resume across page navigations */
  if (sessionStorage.getItem('audio-on') === 'true') setOn(true);

  /* First interaction anywhere on the page starts audio */
  function onFirstInteraction() {
    if (audio.paused && sessionStorage.getItem('audio-on') !== 'false') {
      setOn(true);
    }
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
  }
  document.addEventListener('click', onFirstInteraction);
  document.addEventListener('keydown', onFirstInteraction);
  document.addEventListener('touchstart', onFirstInteraction, { passive: true });

  if (cta) cta.addEventListener('click', () => setOn(true));

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
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
      if (!v.dataset.src) return;

      const start = parseFloat(v.dataset.start || 0);

      /* Add WebM source first if available, then mp4 */
      if (v.dataset.webm) {
        const s1 = document.createElement('source');
        s1.type = 'video/webm'; s1.src = v.dataset.webm;
        const s2 = document.createElement('source');
        s2.type = 'video/mp4'; s2.src = v.dataset.src;
        v.appendChild(s1); v.appendChild(s2);
        v.load();
      } else {
        v.src = v.dataset.src;
      }
      v.removeAttribute('data-src');

      /* Seek to chapter start time after metadata loads */
      if (start > 0) {
        v.addEventListener('loadedmetadata', () => { v.currentTime = start; }, { once: true });
      }

      observer.unobserve(v);
    });
  }, { rootMargin: '200px' });

  videos.forEach(v => observer.observe(v));
}());

/* ── Drifting rabbit mask ─────────────────────────────────── */
(function () {
  const rabbit = document.querySelector('.rabbit-drift');
  if (!rabbit) return;

  let wandering = false;

  function randX() { return window.innerWidth  * (0.05 + Math.random() * 0.85); }
  function randY() { return window.innerHeight * (0.05 + Math.random() * 0.85); }

  function moveTo(x, y, duration) {
    return new Promise(resolve => {
      rabbit.style.transition = `left ${duration}ms cubic-bezier(0.45,0.05,0.55,0.95), top ${duration}ms cubic-bezier(0.45,0.05,0.55,0.95)`;
      rabbit.style.left = `${x}px`;
      rabbit.style.top  = `${y}px`;
      setTimeout(resolve, duration);
    });
  }

  async function wander() {
    wandering = true;

    /* start off-screen */
    rabbit.style.transition = 'none';
    rabbit.style.left = `${-250}px`;
    rabbit.style.top  = `${randY()}px`;
    rabbit.style.opacity = '';
    rabbit.offsetHeight;

    rabbit.classList.add('drifting');

    /* drift through 4-7 random waypoints across the screen */
    const steps = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < steps; i++) {
      const stepDuration = 6000 + Math.random() * 8000;
      await moveTo(randX(), randY(), stepDuration);
    }

    /* fade out then exit off-screen */
    rabbit.style.opacity = '0';
    await moveTo(window.innerWidth + 250, randY(), 5000);

    rabbit.classList.remove('drifting');
    wandering = false;
  }

  function scheduleDrift() {
    const wait = 30000 + Math.random() * 60000;
    setTimeout(() => {
      if (!wandering) wander();
      scheduleDrift();
    }, wait);
  }

  /* First drift fires quickly, then settles into longer intervals */
  setTimeout(() => { if (!wandering) wander(); }, 6000);
  setTimeout(scheduleDrift, 8000);
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
