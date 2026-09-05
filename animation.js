/**
 * ==========================================================================
 * MUSEO DE RECUERDOS PARA MAMÁ - ANIMACIONES E INTERACTIVIDAD
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
   * 1. FONDO AMBIENTAL DE MUSEO (CANVAS CON POLVO DE ESTRELLAS Y LUCES SUAVES)
   * -------------------------------------------------------------------------- */
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let animationFrameId;

  function initCanvas() {
    if (!canvas || !ctx) return;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    createParticles(window.innerWidth < 768 ? 25 : 55);
    animateParticles();
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      if (!canvas) return;
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2.2 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.35;
      this.speedY = -Math.random() * 0.4 - 0.15; // Flotan suavemente hacia arriba
      this.alpha = Math.random() * 0.6 + 0.2;
      this.color = Math.random() > 0.4 ? '183, 148, 244' : '255, 255, 255';
    }
    update() {
      if (!canvas) return;
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
        this.reset();
        this.y = canvas.height + 5;
      }
    }
    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${this.color}, 0.8)`;
      ctx.fill();
    }
  }

  function createParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function animateParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animationFrameId = requestAnimationFrame(animateParticles);
  }

  initCanvas();

  /* --------------------------------------------------------------------------
   * 2. REVELACIÓN DE OBRAS AL HACER SCROLL (SCROLL REVEAL)
   * -------------------------------------------------------------------------- */
  const exhibitCards = document.querySelectorAll('.exhibit-card');
  
  // Establecer estado inicial
  exhibitCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(35px)';
    card.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.35s ease';
  });

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        cardObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  exhibitCards.forEach(card => cardObserver.observe(card));

  /* --------------------------------------------------------------------------
   * 3. FILTRO DE SALAS DE EXPOSICIÓN
   * -------------------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll('.room-filter-btn');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      exhibitCards.forEach(card => {
        const cardRoom = card.getAttribute('data-room');
        if (filterValue === 'all' || cardRoom === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95) translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 350);
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
   * 4. MODAL / LIGHTBOX DE ALTA RESOLUCIÓN CON NAVEGACIÓN
   * -------------------------------------------------------------------------- */
  const modal = document.getElementById('art-modal');
  const modalImg = document.getElementById('modal-img');
  const modalCatalog = document.getElementById('modal-catalog');
  const modalRoom = document.getElementById('modal-room');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalTechnique = document.getElementById('modal-technique');
  const modalDesc = document.getElementById('modal-desc');
  const modalClose = document.getElementById('modal-close');
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');

  // Datos extraídos de las obras
  const exhibitsData = [];
  exhibitCards.forEach((card, idx) => {
    const imgEl = card.querySelector('.artwork-img');
    const catalogEl = card.querySelector('.plaque-catalog-num');
    const roomEl = card.querySelector('.plaque-room-badge');
    const titleEl = card.querySelector('.plaque-title');
    const metaValues = card.querySelectorAll('.plaque-meta-value');
    const descEl = card.querySelector('.plaque-description');

    exhibitsData.push({
      index: idx,
      imgSrc: imgEl ? imgEl.src : '',
      alt: imgEl ? imgEl.alt : '',
      catalog: catalogEl ? catalogEl.textContent : '',
      room: roomEl ? roomEl.textContent : '',
      title: titleEl ? titleEl.textContent : '',
      date: metaValues[0] ? metaValues[0].textContent : '',
      technique: metaValues[1] ? metaValues[1].textContent : '',
      desc: descEl ? descEl.textContent.trim() : ''
    });

    // Eventos de apertura al hacer clic en el cuadro o en el botón "Ampliar"
    const frame = card.querySelector('.artwork-frame');
    const expandBtn = card.querySelector('.plaque-expand-action');

    if (frame) frame.addEventListener('click', () => openModal(idx));
    if (expandBtn) expandBtn.addEventListener('click', () => openModal(idx));
  });

  let currentArtworkIndex = 0;

  function openModal(index) {
    currentArtworkIndex = index;
    updateModalContent();
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Bloquear scroll del fondo
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function updateModalContent() {
    const data = exhibitsData[currentArtworkIndex];
    if (!data) return;

    if (modalImg) {
      modalImg.src = data.imgSrc;
      modalImg.alt = data.alt;
    }
    if (modalCatalog) modalCatalog.textContent = data.catalog;
    if (modalRoom) modalRoom.textContent = data.room;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDate) modalDate.textContent = data.date;
    if (modalTechnique) modalTechnique.textContent = data.technique;
    if (modalDesc) modalDesc.textContent = data.desc;
  }

  function nextArtwork() {
    currentArtworkIndex = (currentArtworkIndex + 1) % exhibitsData.length;
    updateModalContent();
  }

  function prevArtwork() {
    currentArtworkIndex = (currentArtworkIndex - 1 + exhibitsData.length) % exhibitsData.length;
    updateModalContent();
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalNext) modalNext.addEventListener('click', (e) => { e.stopPropagation(); nextArtwork(); });
  if (modalPrev) modalPrev.addEventListener('click', (e) => { e.stopPropagation(); prevArtwork(); });

  // Cerrar al hacer clic en el fondo oscuro
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') nextArtwork();
    if (e.key === 'ArrowLeft') prevArtwork();
  });

  /* --------------------------------------------------------------------------
   * 5. EFECTO DE CONFETI Y DESTELLOS DE CUMPLEAÑOS
   * -------------------------------------------------------------------------- */
  const celebrateBtns = [
    document.getElementById('btn-celebrate-top'),
    document.getElementById('btn-hero-sparkles'),
    document.getElementById('btn-tribute-celebrate')
  ];

  const toast = document.getElementById('toast-celebration');
  let toastTimer;

  function showToast(text) {
    if (!toast) return;
    const toastText = document.getElementById('toast-text');
    if (toastText && text) toastText.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  function launchConfetti(originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
    const colors = ['#7c3aed', '#8b5cf6', '#c4b5fd', '#ffffff', '#d4af37', '#f472b6'];
    const particleCount = 70;

    for (let i = 0; i < particleCount; i++) {
      const piece = document.createElement('div');
      const isSquare = Math.random() > 0.4;
      const size = Math.random() * 9 + 6;
      const color = colors[Math.floor(Math.random() * colors.length)];

      piece.style.position = 'fixed';
      piece.style.left = `${originX}px`;
      piece.style.top = `${originY}px`;
      piece.style.width = `${size}px`;
      piece.style.height = isSquare ? `${size}px` : `${size * 2}px`;
      piece.style.backgroundColor = color;
      piece.style.borderRadius = isSquare ? '50%' : '2px';
      piece.style.zIndex = '9999';
      piece.style.pointerEvents = 'none';
      piece.style.boxShadow = `0 0 10px ${color}`;

      document.body.appendChild(piece);

      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 14 + 5;
      const vx = Math.cos(angle) * velocity;
      let vy = Math.sin(angle) * velocity - 6; // Impulso ascendente
      let rotation = Math.random() * 360;
      let rotSpeed = (Math.random() - 0.5) * 20;
      let posX = originX;
      let posY = originY;
      let opacity = 1;

      function updateConfetti() {
        posX += vx;
        posY += vy;
        vy += 0.45; // Gravedad
        rotation += rotSpeed;
        opacity -= 0.016;

        piece.style.left = `${posX}px`;
        piece.style.top = `${posY}px`;
        piece.style.transform = `rotate(${rotation}deg)`;
        piece.style.opacity = `${opacity}`;

        if (opacity > 0 && posY < window.innerHeight + 50) {
          requestAnimationFrame(updateConfetti);
        } else {
          piece.remove();
        }
      }

      requestAnimationFrame(updateConfetti);
    }
  }

  celebrateBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      launchConfetti(x, y);
      showToast('¡Feliz Cumpleaños a la reina de la casa! 💜🎂');
    });
  });

  /* --------------------------------------------------------------------------
   * 6. AMBIENTE SONORO TRANQUILO (WEB AUDIO API)
   *    Pads etéreos con ondas sinusoidales, reverb largo y progresión lenta
   *    Inspirado en Gymnopédie de Satie y música ambient de Brian Eno
   * -------------------------------------------------------------------------- */
  const audioBtn = document.getElementById('btn-audio-toggle');
  let audioCtx = null;
  let reverbNode = null;
  let masterBus = null;
  let isPlayingMusic = false;
  let musicTimer = null;
  let currentChord = 0;

  /**
   * Progresión ambient ultra-suave en Re Mayor / Si menor
   * Cada acorde flota ~12 segundos con crossfade de 3s
   * Sonido etéreo tipo campanas de cristal y brisa de piano
   *
   * Acordes: Dmaj7 – Gmaj7 – Bm7 – F#m7 – Emaj7 – Amaj7 – Bm7 – Dmaj7
   */
  const ambientChords = [
    // Re Mayor 7 (Dmaj7) — amanecer dorado
    { bass: 73.42,  pads: [146.83, 185.00, 220.00, 277.18] },
    // Sol Mayor 7 (Gmaj7) — brisa cálida
    { bass: 98.00,  pads: [196.00, 246.94, 293.66, 369.99] },
    // Si menor 7 (Bm7) — melancolía dulce
    { bass: 61.74,  pads: [123.47, 146.83, 185.00, 220.00] },
    // Fa# menor 7 (F#m7) — susurro nocturno
    { bass: 46.25,  pads: [92.50, 110.00, 138.59, 164.81] },
    // Mi Mayor 7 (Emaj7) — luz de luna
    { bass: 82.41,  pads: [164.81, 207.65, 246.94, 311.13] },
    // La Mayor 7 (Amaj7) — paz profunda
    { bass: 55.00,  pads: [110.00, 138.59, 164.81, 207.65] },
    // Si menor 7 (Bm7) — reflexión serena
    { bass: 61.74,  pads: [123.47, 146.83, 185.00, 233.08] },
    // Re Mayor 7 (Dmaj7) — regreso al hogar
    { bass: 73.42,  pads: [146.83, 185.00, 220.00, 293.66] },
  ];

  /** Reverb largo y difuso — simula una catedral o espacio abierto */
  function buildReverb(ctx) {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const duration = 5.0; // cola de reverb larga y etérea
    const decay = 2.2;    // decaimiento más lento = más difuso
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);

    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Genera una voz sinusoidal suave y etérea.
   * Usa ondas seno puras con vibrato muy lento y sutil,
   * filtro pasa-bajos agresivo para un sonido cálido tipo cristal.
   */
  function createPadVoice(freq, startTime, duration, peakGain, isBass = false) {
    if (!audioCtx || !masterBus) return;

    const numVoices = isBass ? 2 : 3;
    const detuneSpread = isBass ? 2 : 4; // Muy sutil

    const voiceEnvelope = audioCtx.createGain();
    voiceEnvelope.gain.setValueAtTime(0.0001, startTime);
    // Ataque muy lento: 3s para pads, 2s para bajo — como una respiración
    voiceEnvelope.gain.linearRampToValueAtTime(peakGain, startTime + (isBass ? 2.0 : 3.0));
    // Sustain largo y estable
    voiceEnvelope.gain.setValueAtTime(peakGain, startTime + duration - 3.5);
    // Release muy suave — se desvanece como un eco
    voiceEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    voiceEnvelope.connect(masterBus);

    for (let v = 0; v < numVoices; v++) {
      const osc = audioCtx.createOscillator();
      // Ondas seno puras — el sonido más suave posible
      osc.type = 'sine';

      const detuneOffset = numVoices > 1 ? (v / (numVoices - 1) - 0.5) * detuneSpread : 0;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(detuneOffset, startTime);

      // Vibrato ultra-lento y sutil (LFO ~0.8 Hz, profundidad 1.5 cents)
      const lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(isBass ? 0.5 : 0.8, startTime);
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0, startTime);
      lfoGain.gain.linearRampToValueAtTime(isBass ? 1 : 1.5, startTime + 3.0);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);

      // Filtro pasa-bajos suave — quita todo brillo, deja solo calidez
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBass ? 300 : 900, startTime);
      filter.Q.setValueAtTime(0.3, startTime);

      const voiceGain = audioCtx.createGain();
      voiceGain.gain.setValueAtTime(1.0 / numVoices, startTime);

      osc.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(voiceEnvelope);

      osc.start(startTime);
      lfo.start(startTime);
      osc.stop(startTime + duration + 0.5);
      lfo.stop(startTime + duration + 0.5);
    }
  }

  /** Reproduce un acorde ambient completo (bajo + pads etéreos) */
  function playAmbientChord() {
    if (!isPlayingMusic || !audioCtx) return;

    const chord = ambientChords[currentChord % ambientChords.length];
    currentChord++;

    const now = audioCtx.currentTime;
    const chordDuration = 12.0; // Más largo — cada acorde respira
    const overlapTime = 3.0;    // Crossfade generoso entre acordes

    // Bajo profundo y suave — como un colchón
    createPadVoice(chord.bass, now, chordDuration, 0.06, true);

    // Pads etéreos — entran escalonados como gotas de agua
    chord.pads.forEach((freq, i) => {
      const entryDelay = i * 0.4; // Entrada más espaciada y contemplativa
      createPadVoice(freq, now + entryDelay, chordDuration - entryDelay, 0.025, false);
    });

    // Programar el siguiente acorde
    musicTimer = setTimeout(playAmbientChord, (chordDuration - overlapTime) * 1000);
  }

  function initMuseumAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    audioCtx = new AudioContextClass();

    // Bus maestro — volumen bajo para ambiente tranquilo
    masterBus = audioCtx.createGain();
    masterBus.gain.setValueAtTime(0.50, audioCtx.currentTime);

    // Reverb largo de catedral
    reverbNode = buildReverb(audioCtx);

    // Mezcla 65% reverb, 35% seco — máximo ambiente envolvente
    const dryGain = audioCtx.createGain();
    const wetGain = audioCtx.createGain();
    dryGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    wetGain.gain.setValueAtTime(0.65, audioCtx.currentTime);

    masterBus.connect(dryGain);
    masterBus.connect(reverbNode);
    reverbNode.connect(wetGain);
    dryGain.connect(audioCtx.destination);
    wetGain.connect(audioCtx.destination);

    return true;
  }

  function toggleAmbientMusic() {
    if (!audioCtx) {
      if (!initMuseumAudio()) return;
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isPlayingMusic) {
      isPlayingMusic = true;
      if (audioBtn) {
        audioBtn.classList.add('btn-celebrate');
        audioBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i> <span>Ambiente Tranquilo</span>';
      }
      currentChord = 0;
      playAmbientChord();

    } else {
      isPlayingMusic = false;
      if (musicTimer) clearTimeout(musicTimer);
      if (audioBtn) {
        audioBtn.classList.remove('btn-celebrate');
        audioBtn.innerHTML = '<i class="fa-solid fa-music"></i> <span>Música</span>';
      }
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAmbientMusic);
  }

});
