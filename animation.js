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
   * 6. ORQUESTA AMBIENTAL DE MUSEO (WEB AUDIO API NATIVO)
   *    Cuerdas de cámara, cello, reverb de sala y armonías clásicas
   *    Inspirado en Debussy, Erik Satie y la música de salas del Louvre
   * -------------------------------------------------------------------------- */
  const audioBtn = document.getElementById('btn-audio-toggle');
  let audioCtx = null;
  let reverbNode = null;
  let masterBus = null;
  let isPlayingMusic = false;
  let musicTimer = null;
  let currentChord = 0;

  /**
   * Progresión orquestal lenta en Re menor / Fa Mayor
   * Cada acorde es un pad de cuerdas sostenido (notas simultáneas, no arpegios)
   * duración de cada acorde: ~8 segundos, con crossfade suave
   *
   * Acordes clásicos: Dm – Bb – Gm – Am – F – C – Am – Dm (cadencia perfecta)
   */
  const orchestralChords = [
    // Re menor (Dm) — gravedad y emoción
    { cello: 73.42,  strings: [146.83, 220.00, 261.63, 293.66, 349.23] },
    // Si bemol Mayor (Bb) — calidez dorada
    { cello: 58.27,  strings: [116.54, 174.61, 233.08, 261.63, 293.66] },
    // Sol menor (Gm) — reflexión íntima
    { cello: 49.00,  strings: [98.00,  146.83, 196.00, 233.08, 261.63] },
    // La menor (Am) — tensión expectante
    { cello: 55.00,  strings: [110.00, 164.81, 220.00, 261.63, 329.63] },
    // Fa Mayor (F) — luminosidad cálida
    { cello: 65.41,  strings: [130.81, 174.61, 196.00, 261.63, 349.23] },
    // Do Mayor (C) — serenidad solemne
    { cello: 65.41,  strings: [130.81, 196.00, 261.63, 329.63, 392.00] },
    // La menor (Am7) — nostalgia suave
    { cello: 55.00,  strings: [110.00, 164.81, 220.00, 261.63, 293.66] },
    // Re menor (Dm) — regreso y conclusión
    { cello: 73.42,  strings: [146.83, 220.00, 261.63, 293.66, 440.00] },
  ];

  /** Crea un reverb sintético de sala de conciertos usando un bucle de delay */
  function buildReverb(ctx) {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const duration = 3.5; // segundos de cola de reverb
    const decay = 3.0;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);

    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        // Ruido blanco que decae exponencialmente (sala grande)
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Genera una voz de cuerda orquestal realista para una frecuencia dada.
   * Usa múltiples osciladores ligeramente desafinados (chorus ensemble)
   * y vibrato lento para simular una sección de cuerdas real.
   */
  function createStringVoice(freq, startTime, duration, peakGain, isCello = false) {
    if (!audioCtx || !masterBus) return;

    const numVoices = isCello ? 2 : 4; // Cuerdas: 4 violines; Cello: 2
    const detuneSpread = isCello ? 4 : 8; // Cents de desafinación

    const chordGain = audioCtx.createGain();
    chordGain.gain.setValueAtTime(0.0001, startTime);
    // Ataque lento tipo arco (bow attack): ~1.2s para cuerdas, ~0.8s para cello
    chordGain.gain.linearRampToValueAtTime(peakGain, startTime + (isCello ? 0.8 : 1.4));
    // Sustain pleno
    chordGain.gain.setValueAtTime(peakGain, startTime + duration - 2.0);
    // Decaimiento suave al final
    chordGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    chordGain.connect(masterBus);

    for (let v = 0; v < numVoices; v++) {
      const osc = audioCtx.createOscillator();
      osc.type = isCello ? 'sawtooth' : 'sawtooth';

      // Desafinar cada voz ligeramente para simular un ensemble
      const detuneOffset = (v / (numVoices - 1) - 0.5) * detuneSpread;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(detuneOffset, startTime);

      // Vibrato lento (LFO ~4.5 Hz, profundidad 5 cents)
      const lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(isCello ? 3.8 : 4.5, startTime);
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0, startTime);
      // El vibrato entra gradualmente (como un violinista real)
      lfoGain.gain.linearRampToValueAtTime(isCello ? 3 : 5, startTime + 1.5);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);

      // Filtro para suavizar el timbre (cuerdas no son brillantes en sala)
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isCello ? 500 : 1800, startTime);
      filter.Q.setValueAtTime(0.7, startTime);

      const voiceGain = audioCtx.createGain();
      voiceGain.gain.setValueAtTime(1.0 / numVoices, startTime);

      osc.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(chordGain);

      osc.start(startTime);
      lfo.start(startTime);
      osc.stop(startTime + duration + 0.2);
      lfo.stop(startTime + duration + 0.2);
    }
  }

  /** Reproduce un acorde orquestal completo (cello + pad de cuerdas) */
  function playOrchestraChord() {
    if (!isPlayingMusic || !audioCtx) return;

    const chord = orchestralChords[currentChord % orchestralChords.length];
    currentChord++;

    const now = audioCtx.currentTime;
    const chordDuration = 9.5; // segundos por acorde (largo y sostenido)
    const overlapTime = 1.8;   // crossfade entre acordes

    // Voz de Cello (bajo orquestal profundo)
    createStringVoice(chord.cello, now, chordDuration, 0.10, true);
    // Octava superior del cello para cuerpo
    createStringVoice(chord.cello * 2, now, chordDuration, 0.06, true);

    // Sección de cuerdas (violines / violas) — pad coral
    chord.strings.forEach((freq, i) => {
      // Pequeño offset de entrada escalonado (como en una orquesta real)
      const entryDelay = i * 0.12;
      createStringVoice(freq, now + entryDelay, chordDuration - entryDelay, 0.038, false);
    });

    // Programar el siguiente acorde con overlap suave
    musicTimer = setTimeout(playOrchestraChord, (chordDuration - overlapTime) * 1000);
  }

  function initMuseumAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    audioCtx = new AudioContextClass();

    // Bus maestro con ganancia de salida
    masterBus = audioCtx.createGain();
    masterBus.gain.setValueAtTime(0.72, audioCtx.currentTime);

    // Reverb de sala de conciertos
    reverbNode = buildReverb(audioCtx);

    // Mezcla seca/mojada: 55% reverb, 45% seco
    const dryGain = audioCtx.createGain();
    const wetGain = audioCtx.createGain();
    dryGain.gain.setValueAtTime(0.45, audioCtx.currentTime);
    wetGain.gain.setValueAtTime(0.55, audioCtx.currentTime);

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
        audioBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Orquesta de Museo</span>';
      }
      currentChord = 0;
      playOrchestraChord();

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
