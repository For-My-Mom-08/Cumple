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
   * 6. SINTETIZADOR AMBIENTAL DE PIANO MELANCÓLICO (WEB AUDIO API NATIVO)
   *    Composición íntima y nostálgica en Re menor (estilo Felt Piano / Ludovico Einaudi)
   * -------------------------------------------------------------------------- */
  const audioBtn = document.getElementById('btn-audio-toggle');
  let audioCtx = null;
  let isPlayingMusic = false;
  let musicTimer = null;
  let currentMeasure = 0;

  // Secuencia armónica melancólica en Re menor (Dm -> Bb -> F -> C -> Gm -> Dm/A -> Asus4 -> Dm)
  // Cada compás cuenta con un bajo cálido y notas arpegiadas lentas y expresivas (Hz)
  const melancholicProgression = [
    // 1. Re menor (Dm): Nostalgia y memoria profunda
    { bass: 146.83, melody: [220.00, 293.66, 349.23, 440.00, 349.23, 293.66] },
    // 2. Si bemol Mayor (Bb): Calidez y ternura agridulce
    { bass: 116.54, melody: [174.61, 233.08, 293.66, 349.23, 293.66, 233.08] },
    // 3. Fa Mayor (F): Recuerdos de momentos luminosos
    { bass: 130.81, melody: [174.61, 261.63, 349.23, 440.00, 349.23, 261.63] },
    // 4. Do Mayor (C): Serenidad y gratitud
    { bass: 130.81, melody: [196.00, 261.63, 329.63, 392.00, 329.63, 261.63] },
    // 5. Sol menor (Gm): Sentimiento íntimo y reflexivo
    { bass: 98.00,  melody: [146.83, 196.00, 233.08, 293.66, 233.08, 196.00] },
    // 6. Re menor con bajo en La (Dm/A)
    { bass: 110.00, melody: [146.83, 220.00, 293.66, 349.23, 293.66, 220.00] },
    // 7. La suspendido (Asus4 / A7): Tensión emotiva y suspiro
    { bass: 110.00, melody: [164.81, 220.00, 293.66, 370.00, 293.66, 220.00] },
    // 8. Re menor con 7ma (Dm7): Conclusión que resuena en el alma
    { bass: 146.83, melody: [220.00, 293.66, 349.23, 440.00, 523.25, 440.00] }
  ];

  function playPianoNote(freq, timeOffset = 0, isBass = false, duration = 3.6) {
    if (!audioCtx) return;
    const startTime = audioCtx.currentTime + timeOffset;

    try {
      // Oscilador primario: onda triangular para el cuerpo acústico suave
      const osc = audioCtx.createOscillator();
      osc.type = isBass ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Oscilador secundario: armónico para dar profundidad de cuerda
      const subOsc = audioCtx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * (isBass ? 2 : 0.5), startTime);

      // Filtro Biquad Pasa-Bajas (emula el fieltro de un piano íntimo de estudio)
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBass ? 320 : 750, startTime);
      filter.Q.setValueAtTime(1.3, startTime);

      // Nodos de ganancia y volumen
      const gain = audioCtx.createGain();
      const subGain = audioCtx.createGain();
      const masterGain = audioCtx.createGain();

      const peakVolume = isBass ? 0.085 : 0.052;

      // Curva de volumen: ataque delicado y decaimiento largo y emotivo
      masterGain.gain.setValueAtTime(0.0001, startTime);
      masterGain.gain.linearRampToValueAtTime(peakVolume, startTime + (isBass ? 0.05 : 0.025));
      masterGain.gain.exponentialRampToValueAtTime(peakVolume * 0.4, startTime + 0.6);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      subGain.gain.setValueAtTime(0.02, startTime);

      // Encadenar audio
      osc.connect(gain);
      subOsc.connect(subGain);
      gain.connect(filter);
      subGain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc.start(startTime);
      subOsc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      subOsc.stop(startTime + duration + 0.1);
    } catch (e) {
      console.warn('Audio warning:', e);
    }
  }

  function playMelancholicPhrase() {
    if (!isPlayingMusic || !audioCtx) return;

    const measure = melancholicProgression[currentMeasure % melancholicProgression.length];
    currentMeasure++;

    // Nota de bajo grave y sostenida
    playPianoNote(measure.bass, 0, true, 4.2);

    // Arpegio nostálgico con tempo lento y contemplativo
    const noteSpacing = 0.52;
    measure.melody.forEach((noteFreq, idx) => {
      playPianoNote(noteFreq, idx * noteSpacing, false, 3.4);
    });

    // Programar el siguiente compás tras 3.3 segundos
    musicTimer = setTimeout(playMelancholicPhrase, 3300);
  }

  function toggleAmbientMusic() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isPlayingMusic) {
      isPlayingMusic = true;
      if (audioBtn) {
        audioBtn.classList.add('btn-celebrate');
        audioBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Música Melancólica</span>';
      }

      currentMeasure = 0;
      playMelancholicPhrase();

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
