(function() {
  (function(footerSelector, headerSelector, footerVisibleClass, headerHiddenClass) {
    const header = document.querySelector(headerSelector);
    const footer = document.querySelector(footerSelector);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // 1. Анимируем сам футер (появление/исчезновение)
        entry.target.classList.toggle(footerVisibleClass, entry.isIntersecting);

        // 2. Управляем хедером: если футер виден (isIntersecting: true),
        // добавляем хедеру класс скрытия.
        if (header) {
          header.classList.toggle(headerHiddenClass, entry.isIntersecting);
        }
      });
    }, { threshold: 0.1 });

    if (footer) observer.observe(footer);
  })('.footer-wg', '.header-wg', 'is-visible', 'is-footer-visible');
  // --- 1. CONFIGURATION & CONSTANTS ---
  const CONFIG = {
    SECTION_C_START: 6600,
    SECTION_C_END: 15000,
    SWIPE_THRESHOLD: 50,    // Pixels to trigger a section jump
    FRICTION: 0.95,         // Momentum decay (0.9 - 0.98)
    SCROLL_COOLDOWN: 800,   // MS between discrete jumps
    LERP_STRENGTH: 0.12,    // Smoothness of frame transitions
  };

  const isHomePage = !!document.querySelector('.section-logo-start');
  const isAboutPage = !!document.querySelector('.aboutPage-wrapper');

  // --- 2. FRAME SEQUENCE ENGINE ---
  class FrameSequence {
    constructor(config) {
      this.canvas = document.querySelector(config.selector);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext("2d");
      this.path = config.path;
      this.totalFrames = config.totalFrames;
      this.fps = config.fps || 30;

      this.images = [];
      this.currentFrame = 0;
      this.targetFrame = 0;
      this.direction = 1;
      this.isPlaying = false;
      this.isPreloaded = false;
      this.then = Date.now();

      this.init();
      this.startLerpLoop();
    }

    startLerpLoop() {
      const tick = () => {
        if (!this.isPlaying) {
          const diff = this.targetFrame - this.currentFrame;
          if (Math.abs(diff) > 0.01) {
            this.currentFrame += diff * 0.12;
            this.render();
          }
        }
        requestAnimationFrame(tick);
      };
      tick();
    }
    updateWithLerp(targetProgress) {
      this.targetFrame = Math.max(0, Math.min(this.totalFrames - 1, targetProgress * (this.totalFrames - 1)));
    }

    init() {
      const firstImg = new Image();
      // Загружаем только 1-й кадр сразу, чтобы пользователь что-то видел
      firstImg.src = this.path?.replace('???', '000');
      firstImg.onload = () => {
        this.canvas.width = firstImg.width;
        this.canvas.height = firstImg.height;
        this.images[0] = firstImg;
        this.render();
        this.canvas.classList.add('is-loaded');

        // КЛЮЧЕВОЙ МОМЕНТ: Ждем 2 секунды (пока грузится остальной сайт)
        // и только потом начинаем качать пачку из 300 кадров
        setTimeout(() => this.preloadInChunks(1, 10), 2000);
      };
    }

    // Метод для поочередной загрузки кадров
    async preloadInChunks(startIndex, chunkSize) {
      if (this.isPreloaded) return;

      for (let i = startIndex; i <= this.totalFrames; i += chunkSize) {
        const batch = [];

        for (let j = i; j < i + chunkSize && j <= this.totalFrames; j++) {
          // Пропускаем первый кадр, так как он уже загружен в init()
          if (j === 1 && this.images[0]) continue;

          const img = new Image();
          img.src = this.path.replace('???', j.toString().padStart(3, '0'));

          // Помещаем промис загрузки в массив
          batch.push(
            img.decode()
              .then(() => {
                this.images[j - 1] = img;
              })
              .catch(() => {
                console.warn(`Кадр ${j} не удалось загрузить`);
              })
          );
        }

        // Ждем, пока текущая пачка из 10 картинок загрузится, прежде чем брать следующую
        await Promise.all(batch);

        // Небольшая пауза 50мс между пачками, чтобы дать браузеру обработать другие задачи
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.isPreloaded = true;
      console.log("Все кадры успешно загружены в фоне");
    }

    render() {
      const frameIdx = Math.round(this.currentFrame);
      const img = this.images[frameIdx];
      if (img && img.complete) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
      }
    }

    animate() {
      if (!this.isPlaying) return;
      requestAnimationFrame(() => this.animate());

      const now = Date.now();
      const delta = now - this.then;
      const interval = 1000 / this.fps;

      if (delta > interval) {
        this.then = now - (delta % interval);

        // Проверяем, загружен ли следующий кадр, прежде чем менять индекс
        let nextFrame = this.currentFrame + this.direction;
        if (this.images[nextFrame] && this.images[nextFrame].complete) {
          this.currentFrame = nextFrame;
        }

        if (this.currentFrame >= this.totalFrames - 1) {
          this.direction = -1;
        } else if (this.currentFrame <= 0) {
          this.direction = 1;
        }
        this.render();
      }
    }
    play() {
      if (!this.isPlaying) {
        if (this.currentFrame >= this.totalFrames - 1) {
          this.currentFrame = 0;
          this.direction = 1;
        }
        this.isPlaying = true;
        this.then = Date.now();
        this.animate();
      }
    }

    stop() {
      this.isPlaying = false;
    }

  }

  // --- 3. STATE & UI MANAGEMENT ---
  const animationConfig = [
    { pos: 100, sel: '.section-lamp-transparent', cls: 'is-moved' },
    { pos: 100, sel: '.scroll-down', cls: 'is-hidden-up' },
    { pos: 100, sel: '.sun-hole', cls: 'is-faded' },
    { pos: 100, sel: '.animated-rect', cls: 'is-hidden-up' },
    { pos: 100, sel: '.animated-ellipse', cls: 'is-visible' },
    { pos: 100, sel: '.section-logo-start .text-wrap', cls: 'is-moved' },
    { pos: 100, sel: '.section-logo-start .text p', cls: 'is-visible' },
    { pos: 100, sel: '.section-logo-start .text-founded', cls: 'is-visible' },
    { pos: 600, sel: '.section-lamp-transparent', cls: 'is-faded' },
    { pos: 600, sel: '.section-logo-start .text p', cls: 'is-hidden-up' },
    { pos: 600, sel: '.section-logo-start .text-founded', cls: 'is-hidden-up' },
    { pos: 600, sel: '.section-logo-start .text-wrap svg', cls: 'is-faded' },
    { pos: 600, sel: '.section-logo-start .columns-bg div', cls: 'is-hidden-up' },
    { pos: 600, sel: '.fake-logo', cls: 'is-visible' },
    { pos: 600, sel: '.fake-logo', cls: 'is-moved' },
    { pos: 600, sel: '.header-wg > .wrapper-main nav ul li', cls: 'is-visible' },
    { pos: 600, sel: '.header-wg > .wrapper-main .language', cls: 'is-visible' },
    { pos: 600, sel: '.header-wg > .wrapper-main .icon--sound', cls: 'is-visible' },
    { pos: 600, sel: '.header-wg > .wrapper-main .gamburger', cls: 'is-visible' },
    { pos: 600, sel: '.header-wg span.after', cls: 'is-visible' },
    { pos: 600, sel: '.header-wg .glass', cls: 'is-visible' },
    { pos: 600, sel: '.section-logo-start .shadow-bottom', cls: 'is-visible' },
    { pos: 600, sel: '.section-logo-start .line-bottom', cls: 'is-visible' },
    { pos: 600, sel: '.section-logo-start .text-bottom p', cls: 'is-visible' },
    { pos: 1100, sel: '.section-lamp-colored', cls: 'is-hidden-up' },
    { pos: 1100, sel: '.chair-bg', cls: 'is-visible' },
    { pos: 1100, sel: '.section-logo-start .text-bottom p', cls: 'is-hidden-up' },
    { pos: 1100, sel: '.section-logo-start .line-bottom', cls: 'is-hidden' },
    { pos: 1100, sel: '.line-vertical-fullWh', cls: 'is-visible' },
    { pos: 1100, sel: '.chair-text p', cls: 'is-visible' },
    { pos: 1100, sel: '.chair-canvas-wrapper ', cls: 'is-visible' },
    { pos: 1600, sel: '.section-logo-start .chair-bg', cls: 'is-hidden-up' },
    { pos: 1600, sel: '.chair-text p', cls: 'is-hidden-up' },
    { pos: 1600, sel: '.chair-canvas-wrapper', cls: 'is-hidden-up' },
    { pos: 1600, sel: '.section-logo-start .shadow-bottom', cls: 'is-hidden-up' },
    { pos: 1600, sel: '.slideA', cls: 'is-visible' },
    { pos: 1600, sel: '.slideA-shadow', cls: 'is-visible' },
    { pos: 1600, sel: '.slideA-text p', cls: 'is-visible' },
    { pos: 2100, sel: '.slideA__video-frame', cls: 'is-moved' },
    { pos: 2100, sel: '.slideA .slideA-text p', cls: 'is-hidden-up' },
    { pos: 2100, sel: '.letterA', cls: 'is-hidden-up' },
    { pos: 2100, sel: '.slideA-text-bottom p', cls: 'is-visible' },
    { pos: 2100, sel: '.slideA__video-light', cls: 'is-visible' },
    { pos: 2600, sel: '.slideA__video-light', cls: 'is-moved' },
    { pos: 2600, sel: '.slideA-text-bottom p', cls: 'is-hidden-up' },
    { pos: 2600, sel: '.slideA .slideA__video-frame', cls: 'is-hidden-up' },
    { pos: 2600, sel: '.slideA-text-center p', cls: 'is-visible' },
    { pos: 2600, sel: '.slideA-rounds', cls: 'is-visible' },
    { pos: 3100, sel: '.slideA .slideA-text-center p', cls: 'is-hidden-up' },
    { pos: 3100, sel: '.slideA', cls: 'is-hidden-up' },
    { pos: 3100, sel: '.slideB', cls: 'is-visible' },
    { pos: 3100, sel: '.slideB-text p.slideB-text-1', cls: 'is-visible' },
    { pos: 3100, sel: '.line-vertical-fullWh', cls: 'is-hidden-up' },
    { pos: 3100, sel: '.slideB-shadow', cls: 'is-hidden-up' },
    { pos: 3600, sel: '.slideB-image1', cls: 'is-visible' },
    { pos: 3600, sel: '.slideB-shadow', cls: 'is-hidden-up-down' },
    { pos: 3600, sel: '.slideB .slideB-image1--small', cls: 'is-visible' },
    { pos: 3600, sel: '.slideB .slideB-text', cls: 'is-moved' },
    { pos: 3600, sel: '.photo-slide-1', cls: 'is-visible' },
    { pos: 3600, sel: '.slideB-image2', cls: 'is-hidden-up' },
    { pos: 4100, sel: '.slideB-image1', cls: 'is-hidden-up' },
    { pos: 4100, sel: '.slideB-image2', cls: 'is-visible' },
    { pos: 4100, sel: '.photo-slide-2', cls: 'is-visible' },
    { pos: 4100, sel: '.slideB-text p.slideB-text-1', cls: 'is-hidden-up' },
    { pos: 4100, sel: '.slideB-text p.slideB-text-2', cls: 'is-visible' },
    { pos: 4600, sel: '.slideB-image2', cls: 'is-hidden-up' },
    { pos: 4600, sel: '.slideB-image3', cls: 'is-visible' },
    { pos: 4600, sel: '.slideB-text p.slideB-text-2', cls: 'is-hidden-up' },
    { pos: 4600, sel: '.slideB-text p.slideB-text-3', cls: 'is-visible' },
    { pos: 4600, sel: '.slideB .slideB-image1--small', cls: 'is-hidden-up' },
    { pos: 5100, sel: '.slideB-image3', cls: 'is-hidden-up' },
    { pos: 5100, sel: '.slideB', cls: 'is-hidden-up' },
    { pos: 5100, sel: '.slideC', cls: 'is-visible' },
    { pos: 5100, sel: '.slideC-bg', cls: 'is-visible' },
    { pos: 5100, sel: '.slideC-text.--1 p', cls: 'is-visible' },
    { pos: 5100, sel: '.line-vertical-fullWh', cls: 'is-visible-2' },
    { pos: 5100, sel: '.slideC-scale', cls: 'is-visible' },
    { pos: 5100, sel: '.slideC-scale i', cls: 'is-visible' },
    { pos: 5600, sel: '.slideC-scale i', cls: 'is-moved' },
    { pos: 5600, sel: '.slideC-scale span:nth-child(n + 6)', cls: 'is-active' },
    { pos: 5600, sel: '.slideC-shadow', cls: 'is-opacity-30' },
    { pos: 5600, sel: '.slideC-text-bottom p', cls: 'is-visible' },
    { pos: 6100, sel: '.slideC-scale i', cls: 'is-moved-2' },
    { pos: 6100, sel: '.slideC-scale span:nth-child(-n + 5)', cls: 'is-active' },
    { pos: 6100, sel: '.slideC-text-bottom p', cls: 'is-hidden-mob' },
    { pos: 6100, sel: '.slideC-text-bottom-right p', cls: 'is-visible' },
    { pos: 6100, sel: '.slideC-shadow', cls: 'is-opacity-20' },
    { pos: 6600, sel: '.slideC-text.--1', cls: 'is-hidden-up' },
    { pos: 6600, sel: '.slideC-text.--2 p', cls: 'is-visible' },
    { pos: 6600, sel: '.slideC-text-bottom', cls: 'is-hidden-up' },
    { pos: 6600, sel: '.slideC-text-bottom-right.--1', cls: 'is-hidden-up' },
    { pos: 6600, sel: '.slideC-text-bottom-right.--2 p', cls: 'is-visible' },
    { pos: 6600, sel: '.slideC-shadow-2', cls: 'is-visible' },
    { pos: 6600, sel: '.slideC .slideC-bg img', cls: 'is-moved' },
    { pos: 6600, sel: '.slideC .slideC-scale', cls: 'is-hidden-up' },
    { pos: 6600, sel: '.line-vertical-fullWh', cls: 'is-hidden-up-2' },
    { pos: 6600, sel: '.italy-icon', cls: 'is-visible' },
    { pos: 6600, sel: '.chair-canvas-wrapper2', cls: 'is-visible' },

    { pos: 6600, sel: '.italy-icon', cls: 'is-visible_' },
    { pos: 15000, sel: '.italy-icon', cls: 'is-visible_' },

    { pos: 15100, sel: '.slideC', cls: 'is-hidden-up' },
    { pos: 15100, sel: '.slideD', cls: 'is-visible' },
    { pos: 15100, sel: '.slideD-text-top p', cls: 'is-visible' },
    { pos: 15500, sel: '.slideD-bg-img', cls: 'is-dark' },
    { pos: 15500, sel: '.slideD-bg img', cls: 'is-moved' },
    { pos: 15500, sel: '.slideD .slideD-text-top', cls: 'is-moved' },
    { pos: 15500, sel: '.slideD-text-bottom p', cls: 'is-visible' },
    { pos: 15500, sel: '.slideD-shadow-bottom', cls: 'is-visible' },
    // { pos: 15870, sel: '.slideD-text-bottom', cls: 'is-moved-1' },
    { pos: 16100, sel: '.slideD-bg img', cls: 'is-moved-2' },
    { pos: 16100, sel: '.slideD .slideD-text-top', cls: 'is-hidden-up' },
    { pos: 16170, sel: '.main-page .footer-wg', cls: 'is-visible' },
    { pos: 16170, sel: '.slideD-text-bottom', cls: 'is-moved-3' },
    { pos: 16170, sel: '.slideD-bg .shadow--mob', cls: 'is-visible' },

    // about page
    { pos: 100, sel: '.aboutSlide1', cls: 'is-moved' },
    { pos: 100, sel: '.line-horizontal-center', cls: 'is-visible' },
    { pos: 100, sel: '.aboutSlide1__text-top p', cls: 'is-visible' },

    { pos: 600, sel: '.aboutSlide1__text-top p', cls: 'is-hidden-up' },
    { pos: 600, sel: '.line-vertical-center', cls: 'is-visible' },
    { pos: 600, sel: '.aboutSlide1 .img--2', cls: 'is-hidden-up' },
    { pos: 600, sel: '.aboutSlide1', cls: 'is-hidden-up' },
    { pos: 600, sel: '.aboutSlide2', cls: 'is-visible' },
    { pos: 600, sel: '.aboutSlide2 .txt p', cls: 'is-visible' },
    { pos: 600, sel: '.line-horizontal-center', cls: 'is-showing' },

    { pos: 1100, sel: '.aboutSlide2 .txt p', cls: 'is-hidden-up' },
    { pos: 1100, sel: '.aboutSlide3', cls: 'is-visible' },
    { pos: 1100, sel: '.aboutSlide3-video', cls: 'is-visible' },
    { pos: 1100, sel: '.line-vertical-center', cls: 'is-hidden-up' },
    { pos: 1100, sel: '.line-horizontal-center', cls: 'is-hidden-up' },
    { pos: 1100, sel: '.aboutSlide3__text-top p', cls: 'is-visible' },
    { pos: 1100, sel: '.aboutSlide3__text-bot-1 p', cls: 'is-visible' },

    { pos: 1600, sel: '.aboutSlide3__text-bot-1', cls: 'is-moved' },
    { pos: 1600, sel: '.aboutSlide3__text-bot-2 p', cls: 'is-visible' },
    { pos: 1600, sel: '.aboutSlide3__text-bot-2', cls: 'is-moved' },

    { pos: 2100, sel: '.aboutSlide3__text-bot-3 p', cls: 'is-visible' },

    { pos: 2600, sel: '.aboutSlide3__text-top p', cls: 'is-hidden-up' },
    { pos: 2600, sel: '.aboutSlide3 .txt p', cls: 'is-hidden-up' },
    { pos: 2600, sel: '.aboutSlide3 .aboutSlide3-video', cls: 'is-moved' },
    { pos: 2600, sel: '.aboutSlide3 .txt2 p', cls: 'is-visible' },
    { pos: 3100, sel: '.is-about-page .footer-wg', cls: 'is-visible' },
  ].map(item => ({ ...item, nodes: document.querySelectorAll(item.sel) }));

  const videoCache = {};
  const manageVideo = (y, start, end, selector) => {
    if (!videoCache[selector]) {
      videoCache[selector] = document.querySelector(selector);
    }
    const video = videoCache[selector];
    if (!video) return;

    const isInside = y >= start && y < end;

    if (isInside) {
      if (video.paused && !video.dataset.isplaying) {
        video.dataset.isplaying = "true";
        video.play()
          .then(() => { video.dataset.isplaying = ""; })
          .catch(() => { video.dataset.isplaying = ""; });
      }
    } else {
      if (!video.paused) {
        video.pause();
        video.dataset.isplaying = "";
        if (video.currentTime !== 0) video.currentTime = 0;
      }
    }
  };

  const scrollSteps = [...new Set(animationConfig.map(item => item.pos))].sort((a, b) => a - b);
  if (scrollSteps[0] !== 0) scrollSteps.unshift(0);

  let virtualY = 0;
  let currentStepIndex = 0;
  let isAnimating = false;
  let isStepTriggered = false;
  let velocity = 0;
  let lastTouchY = 0;
  let touchStartY = 0;
  let lastTouchTime = 0;
  let inertiaFrame = null;
  let lastScrollTime = 0;

  const updateUI = (y) => {
    animationConfig.forEach(item => {
      const shouldActive = y >= item.pos;
      item.nodes.forEach(n => n.classList.toggle(item.cls, shouldActive));
    });

    // Handle Chair Animation Progress
    if (chairVideo2 && chairVideo2.canvas) {
      const progress = (Math.max(CONFIG.SECTION_C_START, Math.min(CONFIG.SECTION_C_END, y)) - CONFIG.SECTION_C_START) / (CONFIG.SECTION_C_END - CONFIG.SECTION_C_START);
      chairVideo2.updateWithLerp(progress);
    }

    // Toggle auto-play for other sequences
    // (y >= 1100 && y < 1600) ? chairVideo.play() : chairVideo.stop();
    if (chairVideo && chairVideo.canvas) {
      const isChair1Active = y >= 1100 && y < 1600;
      if (isChair1Active) {
        if (!chairVideo.isPlaying) {
          if (chairVideo.currentFrame >= chairVideo.totalFrames - 1) {
            chairVideo.currentFrame = 0;
          }
          chairVideo.play();
        }
      } else {
        chairVideo.stop();
        if (chairVideo.currentFrame !== 0) {
          chairVideo.currentFrame = 0;
          chairVideo.render();
        }
      }
    }

    manageVideo(y, 2100, 3100, '.light-video');
    manageVideo(y, 1600, 2600, '.slideA-video');
    manageVideo(y, 1100, 4600, '.aboutSlide3-video');
  };

  const goToStep = (direction) => {
    if (isAnimating) return;
    const nextIndex = currentStepIndex + direction;
    if (nextIndex < 0 || nextIndex >= scrollSteps.length) return;

    const nextPos = scrollSteps[nextIndex];
    if ((isHomePage && nextPos > 16170) || (isAboutPage && nextPos > 3100)) return;

    isAnimating = true;
    currentStepIndex = nextIndex;
    virtualY = scrollSteps[currentStepIndex];

    document.body.classList.add('is-locking');
    updateUI(virtualY);

    setTimeout(() => {
      isAnimating = false;
      document.body.classList.remove('is-locking');
    }, (virtualY >= CONFIG.SECTION_C_START && virtualY <= CONFIG.SECTION_C_END) ? 100 : 800);
  };

  // --- 4. PHYSICS ENGINE (Inertia) ---
  const startInertia = () => {
    if (Math.abs(velocity) < 0.1) return;

    virtualY += velocity;
    velocity *= CONFIG.FRICTION;

    // Boundary snap for inertia
    if (virtualY <= CONFIG.SECTION_C_START || virtualY >= CONFIG.SECTION_C_END) {
      virtualY = Math.max(CONFIG.SECTION_C_START, Math.min(CONFIG.SECTION_C_END, virtualY));
      currentStepIndex = scrollSteps.findLastIndex(s => s <= virtualY);
      velocity = 0;
    }

    updateUI(virtualY);
    inertiaFrame = requestAnimationFrame(startInertia);
  };

  // --- 5. EVENT LISTENERS ---

  window.addEventListener('wheel', (e) => {
    if (!(isHomePage || isAboutPage)) return;
    e.preventDefault();

    const inZone = virtualY > CONFIG.SECTION_C_START && virtualY < CONFIG.SECTION_C_END;
    const pushingIn = (virtualY === CONFIG.SECTION_C_START && e.deltaY > 0) ||
      (virtualY === CONFIG.SECTION_C_END && e.deltaY < 0);

    if (inZone || pushingIn) {
      virtualY = Math.max(CONFIG.SECTION_C_START, Math.min(CONFIG.SECTION_C_END, virtualY + e.deltaY * 0.8));
      updateUI(virtualY);
      currentStepIndex = scrollSteps.findLastIndex(s => s <= virtualY);
    } else {
      if (Date.now() - lastScrollTime < CONFIG.SCROLL_COOLDOWN || isAnimating) return;
      if (Math.abs(e.deltaY) < 15) return;
      lastScrollTime = Date.now();
      goToStep(e.deltaY > 0 ? 1 : -1);
    }
  }, { passive: false });

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    lastTouchY = touchStartY;
    lastTouchTime = Date.now();
    isStepTriggered = false;
    cancelAnimationFrame(inertiaFrame);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = lastTouchY - currentY;
    const totalDiff = touchStartY - currentY;
    const now = Date.now();

    const inZone = virtualY >= CONFIG.SECTION_C_START && virtualY <= CONFIG.SECTION_C_END;

    if (inZone && !isStepTriggered) {
      // Calculate velocity for inertia later
      const dt = now - lastTouchTime;
      if (dt > 0) velocity = (deltaY / dt) * 16;

      virtualY = Math.max(CONFIG.SECTION_C_START - 1, Math.min(CONFIG.SECTION_C_END + 1, virtualY + deltaY * 5));
      updateUI(virtualY);
      // currentStepIndex = scrollSteps.findLastIndex(s => s <= virtualY);

      // Check if we just pulled OUT of the zone by a threshold
      if (virtualY <= CONFIG.SECTION_C_START && totalDiff < -CONFIG.SWIPE_THRESHOLD) {
        isStepTriggered = true;
        goToStep(-1);
      } else if (virtualY >= CONFIG.SECTION_C_END && totalDiff > CONFIG.SWIPE_THRESHOLD) {
        isStepTriggered = true;
        goToStep(1);
      }
    } else if (!isStepTriggered && Math.abs(totalDiff) > CONFIG.SWIPE_THRESHOLD) {
      isStepTriggered = true;
      goToStep(totalDiff > 0 ? 1 : -1);
    }

    lastTouchY = currentY;
    lastTouchTime = now;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!isStepTriggered && virtualY > CONFIG.SECTION_C_START && virtualY < CONFIG.SECTION_C_END) {
      startInertia();
    }
  }, { passive: true });

  // Keyboard (Arrows)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goToStep(1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goToStep(-1);
  });

  // Init
  const chairVideo = new FrameSequence({ selector: '#chair-canvas', path: './images/chair-frames3/frame_???.webp', totalFrames: 241, fps: 24 });
  const chairVideo2 = new FrameSequence({ selector: '#chair-canvas2', path: './images/seq_480/frame_???.webp', totalFrames: 483, fps: 24 });
  updateUI(0);

  // Utility for viewport scaling
  const setWindowSizeVars = () => {
    const html = document.documentElement;
    html.style.setProperty('--win-w', window.innerWidth);
    html.style.setProperty('--win-h', window.innerHeight);
    const fontSize = parseFloat(window.getComputedStyle(html).fontSize);
    html.style.setProperty('--rem-coef', fontSize / 16);
  };

  setWindowSizeVars();
  window.addEventListener('resize', setWindowSizeVars);

  document.body.style.setProperty('height', 'auto', 'important');
})();
