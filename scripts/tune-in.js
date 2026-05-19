/* Three Paper Masks — tune-in.js
   Scroll-driven WebGL broadcast tuning intro.
   Loaded dynamically — only runs on desktop with WebGL support.
   Import via: import('/scripts/tune-in.js').then(m => m.initTuneIn()) */

import * as THREE from 'three';

export function initTuneIn() {
  const canvas = document.getElementById('tune-canvas');
  if (!canvas) return;

  /* ── Renderer ────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ── Texture ─────────────────────────────────────────────── */
  const texture = new THREE.TextureLoader().load('/assets/images/tune-target.jpg');
  texture.minFilter = THREE.LinearFilter;

  /* ── Uniforms ────────────────────────────────────────────── */
  const uniforms = {
    uTime:        { value: 0 },
    uTuning:      { value: 0 },   /* 0 = static, 1 = clear image */
    uImage:       { value: texture },
    uAspect:      { value: window.innerWidth / window.innerHeight },
    uImageAspect: { value: 16 / 9 }  /* update if tune-target.jpg is not 16:9 */
  };

  /* ── Shaders ─────────────────────────────────────────────── */
  const vertexShader = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */`
    varying vec2 vUv;
    uniform float uTime;
    uniform float uTuning;
    uniform sampler2D uImage;
    uniform float uAspect;
    uniform float uImageAspect;

    /* Hash-based noise — no texture lookup needed */
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      /* Cover-fit: center UV and scale to fill screen */
      vec2 uv = vUv - 0.5;
      if (uAspect > uImageAspect) {
        uv.y *= uAspect / uImageAspect;
      } else {
        uv.x *= uImageAspect / uAspect;
      }
      uv += 0.5;

      /* Horizontal distortion that fades as signal improves */
      float distort = (1.0 - uTuning) * 0.04;
      uv.x += sin(uv.y * 60.0 + uTime * 3.0) * distort;
      uv.y += sin(uv.x * 80.0 + uTime * 4.0) * distort * 0.5;

      /* Chromatic aberration — peaks at mid-tune, resolves at clarity */
      float aberration = sin(uTuning * 3.14159) * 0.008;
      float r = texture2D(uImage, uv + vec2(aberration, 0.0)).r;
      float g = texture2D(uImage, uv).g;
      float b = texture2D(uImage, uv - vec2(aberration, 0.0)).b;
      vec3 imageColor = vec3(r, g, b);

      /* Procedural static */
      float staticVal = hash(vUv * 1000.0 + uTime * 100.0);
      vec3 staticColor = vec3(staticVal * 0.9 + 0.05);

      /* Blend: heavy static early → clean image late */
      float mixAmount = smoothstep(0.1, 0.9, uTuning);
      vec3 finalColor = mix(staticColor, imageColor, mixAmount);

      /* Residual static floor — keeps it feeling like found footage, not a glossy hero */
      finalColor = mix(finalColor, staticColor, 0.05);

      /* Scanlines */
      finalColor *= 0.92 + 0.08 * sin(vUv.y * 800.0);

      /* Vignette */
      vec2 centered = vUv - 0.5;
      float vignette = 1.0 - dot(centered, centered) * 0.5;
      finalColor *= vignette;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  /* ── Geometry ────────────────────────────────────────────── */
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const plane    = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(plane);

  /* ── Animation loop ──────────────────────────────────────── */
  let rafId;
  let running = true;

  function animate(t) {
    if (!running) return;
    uniforms.uTime.value = t * 0.001;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);

  /* ── Resize ──────────────────────────────────────────────── */
  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  };
  window.addEventListener('resize', onResize, { passive: true });

  /* ── Scroll → tuning progress ────────────────────────────── */
  const tuneSection = document.getElementById('tune-in');
  const labels      = document.querySelectorAll('.tune-label');

  const updateTuning = () => {
    const rect      = tuneSection.getBoundingClientRect();
    const scrolled  = Math.max(0, -rect.top);
    const progress  = Math.min(1, scrolled / (tuneSection.offsetHeight - window.innerHeight));

    uniforms.uTuning.value = progress;

    labels.forEach(l => l.classList.remove('active'));
    if      (progress < 0.33) labels[0]?.classList.add('active');
    else if (progress < 0.75) labels[1]?.classList.add('active');
    else                      labels[2]?.classList.add('active');
  };

  window.addEventListener('scroll', updateTuning, { passive: true });
  updateTuning();

  /* ── Mark complete + clean up ────────────────────────────── */
  const markComplete = () => {
    const rect = tuneSection.getBoundingClientRect();
    if (rect.bottom > 0) return;

    /* Persist: skip intro on future visits */
    localStorage.setItem('tpm-tuned-in', 'true');
    localStorage.setItem('tpm-seen', '1'); /* also suppress CRT on future index visits */

    /* Stop GPU work once intro is out of view */
    running = false;
    cancelAnimationFrame(rafId);
    renderer.dispose();
    window.removeEventListener('scroll', updateTuning);
    window.removeEventListener('scroll', markComplete);
    window.removeEventListener('resize', onResize);
  };

  window.addEventListener('scroll', markComplete, { passive: true });
}
