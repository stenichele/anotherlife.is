(() => {
  'use strict';

  const continuations = ['emerging.', 'becoming.', 'growing.', 'belonging.'];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const word = document.getElementById('continuation');
  const pauseButton = document.getElementById('motion');
  const seedButton = document.getElementById('seed');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  let paused = motionPreference.matches;
  let wordIndex = 0;
  let wordTimer;
  let transitionTimer;

  function closeMenu() {
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.innerHTML = 'Menu <span aria-hidden="true">+</span>';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.innerHTML = open ? 'Close <span aria-hidden="true">−</span>' : 'Menu <span aria-hidden="true">+</span>';
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });

  const canvas = document.getElementById('ecology');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.querySelector('.field-info').hidden = true;
    document.querySelector('.animation-controls').hidden = true;
    return;
  }
  const population = document.getElementById('population');
  const modeNames = { individual: 'Individuals', relational: 'Relationships', collective: 'Society' };
  const colors = ['181,245,71', '215,235,168', '124,168,91', '110,191,158'];
  let mode = 'relational';
  let width = 1200, height = 800, elapsed = 0, frameId = 0, lastTime = 0;
  let visible = true;
  let randomSeed = 41;
  let pointer = null;
  const particles = [];

  function random() {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
  }
  function createParticle(x, y) {
    const group = Math.floor(random() * 4);
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * .32;
    return {
      x: x ?? width * (.71 + Math.cos(angle) * radius),
      y: y ?? height * (.48 + Math.sin(angle) * radius * 1.22),
      vx: (random() - .5) * .5,
      vy: (random() - .5) * .5,
      group, phase: random() * Math.PI * 2,
      size: 1.1 + random() * 1.7,
      kind: Math.floor(random() * 3),
      trail: []
    };
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const oldWidth = width, oldHeight = height;
    width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const particle of particles) {
      particle.x *= width / oldWidth; particle.y *= height / oldHeight;
      particle.trail.length = 0;
    }
    render(false);
  }
  resize();
  for (let index = 0; index < 120; index++) particles.push(createParticle());
  population.textContent = String(particles.length);

  function addLife(x, y) {
    if (particles.length >= 180) return;
    particles.push(createParticle(x, y));
    population.textContent = String(particles.length);
    if (particles.length >= 180) {
      seedButton.disabled = true;
      seedButton.textContent = 'Field complete';
    }
    render(false);
  }
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  canvas.addEventListener('pointerleave', () => { pointer = null; });
  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    addLife(event.clientX - rect.left, event.clientY - rect.top);
  });
  seedButton.addEventListener('click', () => addLife());

  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode;
      document.querySelectorAll('[data-mode]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      document.getElementById('perspective').textContent = modeNames[mode];
      render(false);
    });
  });

  function render(advance) {
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .76, height * .44, 0, width * .76, height * .44, width * .55);
    glow.addColorStop(0, 'rgba(79,106,35,.12)');
    glow.addColorStop(1, 'rgba(9,12,8,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(181,245,71,.12)';
    for (let x = 36; x < width; x += 64) {
      for (let y = 110; y < height - 60; y += 64) ctx.fillRect(x, y, .8, .8);
    }

    const centers = [
      { x: width * .7, y: height * .27 }, { x: width * .85, y: height * .52 },
      { x: width * .55, y: height * .65 }, { x: width * .92, y: height * .81 }
    ];
    if (advance) elapsed += 1;
    if (mode === 'collective') {
      for (let group = 0; group < 4; group++) {
        const center = centers[group];
        ctx.strokeStyle = `rgba(${colors[group]},.12)`;
        ctx.setLineDash([2, 8]);
        ctx.beginPath(); ctx.ellipse(center.x, center.y, width * .105, height * .12, -.3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    for (const particle of particles) {
      if (advance) {
        const center = mode === 'collective' ? centers[particle.group] : { x: width * .72, y: height * .48 };
        const dx = center.x - particle.x, dy = center.y - particle.y;
        const distance = Math.hypot(dx, dy) || 1;
        const orbit = mode === 'collective' ? width * .07 : width * .25;
        const pull = (distance - orbit) * .00012;
        particle.vx += dx / distance * pull - dy / distance * .012;
        particle.vy += dy / distance * pull + dx / distance * .012;
        particle.vx += Math.sin(elapsed * .005 + particle.phase) * .004;
        particle.vy += Math.cos(elapsed * .006 + particle.phase) * .004;
        if (pointer) {
          const px = pointer.x - particle.x, py = pointer.y - particle.y;
          const pd = Math.hypot(px, py);
          if (pd < 180 && pd > 25) {
            particle.vx += px / pd * .024; particle.vy += py / pd * .024;
          }
        }
        particle.vx *= .983; particle.vy *= .983;
        particle.x += particle.vx; particle.y += particle.vy;
        if (particle.x < 15 || particle.x > width - 15) particle.vx *= -.8;
        if (particle.y < 100 || particle.y > height - 30) particle.vy *= -.8;
        particle.x = Math.max(10, Math.min(width - 10, particle.x));
        particle.y = Math.max(95, Math.min(height - 20, particle.y));
        if (elapsed % 4 === 0) {
          particle.trail.push([particle.x, particle.y]);
          if (particle.trail.length > 18) particle.trail.shift();
        }
      }
      if (particle.trail.length > 1) {
        ctx.strokeStyle = `rgba(${colors[particle.group]},.12)`; ctx.lineWidth = .6;
        ctx.beginPath(); particle.trail.forEach(([x,y], index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
      }
    }

    if (mode !== 'individual') {
      const radius = width < 760 ? 70 : 115;
      ctx.lineWidth = .55;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const p = particles[a], q = particles[b];
          if (mode === 'collective' && p.group !== q.group) continue;
          const dist = Math.hypot(p.x-q.x,p.y-q.y);
          if (dist < radius) {
            ctx.strokeStyle = `rgba(${colors[p.group]},${.24 * (1-dist/radius)})`;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
          }
        }
      }
    }
    for (const particle of particles) {
      const brightness = .45 + Math.sin(elapsed * .012 + particle.phase) * .15;
      ctx.fillStyle = `rgba(${colors[particle.group]},${brightness})`;
      ctx.strokeStyle = `rgba(${colors[particle.group]},${brightness})`;
      ctx.lineWidth = .8;
      ctx.beginPath();
      if (particle.kind === 0) { ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2); ctx.fill(); }
      else if (particle.kind === 1) { ctx.arc(particle.x,particle.y,particle.size*1.3,0,Math.PI*2); ctx.stroke(); }
      else { ctx.rect(particle.x-particle.size/2,particle.y-particle.size/2,particle.size,particle.size); ctx.fill(); }
    }
  }

  function frame(now) {
    frameId = 0;
    if (paused || !visible || document.hidden) return;
    if (now - lastTime >= 32) { render(true); lastTime = now; }
    frameId = requestAnimationFrame(frame);
  }
  function schedule() {
    if (!paused && visible && !document.hidden && !frameId) frameId = requestAnimationFrame(frame);
  }
  function updateMotion() {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    document.querySelector('.cursor').style.animationPlayState = paused ? 'paused' : 'running';
    clearInterval(wordTimer); clearTimeout(transitionTimer); word.classList.remove('changing');
    if (!paused) {
      wordTimer = setInterval(() => {
        if (!visible || document.hidden) return;
        word.classList.add('changing');
        transitionTimer = setTimeout(() => {
          wordIndex = (wordIndex + 1) % continuations.length;
          word.textContent = continuations[wordIndex]; word.classList.remove('changing');
        }, 220);
      }, 6500);
    } else if (frameId) {
      cancelAnimationFrame(frameId); frameId = 0;
    }
    schedule();
  }
  pauseButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
  motionPreference.addEventListener('change', event => { paused = event.matches; updateMotion(); });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    schedule();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    schedule();
  });
  render(false); updateMotion();
})();
