document.addEventListener('DOMContentLoaded', () => {

  // Force fresh loads to start at top (avoids scroll restoration skipping reveal animations)
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  // Scroll-progress bar
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = total > 0 ? `${(window.scrollY / total) * 100}%` : '0%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  // Header scroll state
  const header = document.querySelector('header');
  if (header) {
    const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // Custom eased smooth scroll
  const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  const smoothScrollTo = (targetY, duration = 800) => {
    const startY = window.scrollY;
    const dist   = targetY - startY;
    let   start  = null;
    const step   = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      window.scrollTo(0, startY + dist * easeOutExpo(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href*="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href    = a.getAttribute('href');
      const hi      = href.indexOf('#');
      if (hi === -1) return;
      const hash    = href.slice(hi);
      const pageRef = href.slice(0, hi);
      const same    = !pageRef
        || window.location.pathname.endsWith(pageRef)
        || window.location.href.includes(pageRef);
      if (!same) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const navH = header?.offsetHeight ?? 66;
      smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - navH, 820);
      history.pushState(null, '', hash);
    });
  });

  // Mobile nav
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const backdrop  = document.querySelector('.nav-backdrop');

  // Track the scroll position so it can be restored on close, and so the
  // lock technique below doesn't rely on plain `overflow: hidden`.
  let navScrollY = 0;

  const openNav = () => {
    navScrollY = window.scrollY;
    navLinks?.classList.add('active');
    backdrop?.classList.add('visible');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    // Lock scroll by pinning the body in place rather than toggling
    // `overflow: hidden`. On iOS Safari, setting overflow:hidden on body
    // while the page is already scrolled can desync the browser's fixed-
    // positioning reference from the true top of the viewport, leaving a
    // gap above fixed elements (like the header) until the page is
    // scrolled again. Using position:fixed with a negative top offset
    // avoids that entirely.
    document.body.style.position = 'fixed';
    document.body.style.top = `-${navScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };
  const closeNav = () => {
    navLinks?.classList.remove('active');
    backdrop?.classList.remove('visible');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, navScrollY);
  };

  hamburger?.addEventListener('click', () =>
    navLinks?.classList.contains('active') ? closeNav() : openNav()
  );
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  backdrop?.addEventListener('click', closeNav);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  backdrop?.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

  // Typewriter effect for hero eyebrow
  const typewriterEl = document.getElementById('hero-typewriter');
  if (typewriterEl) {
    const phrases = [
      'Mechanical & Aerospace Eng.',
      'SolidWorks · FEA · Arduino',
      'Builder · Designer · Maker',
    ];
    let   phraseIdx = 0;
    let   charIdx   = 0;
    let   deleting  = false;
    const PAUSE_END   = 1900;
    const PAUSE_START = 350;
    const SPEED_TYPE  = 52;
    const SPEED_DEL   = 28;

    const tick = () => {
      const phrase = phrases[phraseIdx];

      if (!deleting) {
        typewriterEl.textContent = phrase.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx === phrase.length) {
          deleting = true;
          setTimeout(tick, PAUSE_END);
          return;
        }
      } else {
        typewriterEl.textContent = phrase.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, PAUSE_START);
          return;
        }
      }
      setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE);
    };
    setTimeout(tick, 500); // brief delay before starting
  }

  // Project filtering
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-outline');
      });
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary', 'active');

      const filter = btn.dataset.filter;
      projectCards.forEach(card => {
        const cat = card.dataset.category || '';
        const match = filter === 'all' || cat.split(' ').includes(filter);
        // Coming-soon cards always visible when filter is "all"
        const isSoon = card.classList.contains('project-card--soon');
        card.classList.toggle('hide', !match && !(isSoon && filter === 'all'));
      });
    });
  });

  // Block navigation on coming-soon cards
  document.querySelectorAll('.project-card--soon').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
    });
    // Remove href if accidentally set
    if (card.tagName === 'A') card.removeAttribute('href');
  });

  // Scroll-spy: active nav link
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href*="#"]');

  if (sections.length && navAnchors.length) {
    sections.forEach(s =>
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          navAnchors.forEach(a =>
            a.classList.toggle('nav-active', a.getAttribute('href').includes(`#${e.target.id}`))
          );
        });
      }, { rootMargin: '-38% 0px -57% 0px' }).observe(s)
    );
  }

  // Section title underline trigger
  const titleObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      titleObs.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.section-title').forEach(t => titleObs.observe(t));

  // Scroll-reveal
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('[data-reveal]');

  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        revealObs.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(el => revealObs.observe(el));
  }

  // Spec-plate row + chip staggered entrance
  const specChips = document.querySelectorAll('.spec-chip');
  const specRows = document.querySelectorAll('.spec-row');
  if (specChips.length) {
    specRows.forEach((row, ri) => {
      row.style.setProperty('--ri', ri);
      row.querySelectorAll('.spec-chip').forEach((chip, i) => chip.style.setProperty('--i', i));
    });
    if (prefersReduced) {
      specRows.forEach(row => row.classList.add('is-visible'));
      specChips.forEach(chip => chip.classList.add('is-visible'));
    } else {
      const specObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          e.target.querySelectorAll('.spec-chip').forEach(chip => chip.classList.add('is-visible'));
          specObs.unobserve(e.target);
        });
      }, { threshold: 0.2 });
      specRows.forEach(row => specObs.observe(row));
    }
  }

  // Stat banner count-up + type-out effects
  // Ties into the parent [data-reveal] element's "is-visible" class so the
  // numbers animate as the card slides in, not on a separate timer.
  const countEls = document.querySelectorAll('[data-count-to]');
  const typeEls  = document.querySelectorAll('[data-type-text]');

  const animateCount = el => {
    const target = parseFloat(el.dataset.countTo);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const isInt  = Number.isInteger(target);
    const duration = 1300;
    let start = null;

    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = target * eased;
      el.textContent = prefix + (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target + suffix;
    };
    requestAnimationFrame(step);
  };

  const animateType = el => {
    const text = el.dataset.typeText;
    let i = 0;
    el.textContent = '';
    el.classList.add('is-typing');

    const step = () => {
      el.textContent = text.slice(0, i + 1);
      i++;
      if (i < text.length) setTimeout(step, 110);
      else el.classList.remove('is-typing');
    };
    step();
  };

  if (prefersReduced) {
    countEls.forEach(el => {
      el.textContent = (el.dataset.prefix || '') + el.dataset.countTo + (el.dataset.suffix || '');
    });
    typeEls.forEach(el => { el.textContent = el.dataset.typeText; });
  } else if (countEls.length || typeEls.length) {
    const runStatAnimations = () => {
      countEls.forEach(animateCount);
      typeEls.forEach(animateType);
    };

    // Find the nearest ancestor participating in the scroll-reveal system
    const statRow = document.querySelector('.project-results-row');
    const revealParent = statRow ? statRow.closest('[data-reveal]') : null;

    if (revealParent) {
      if (revealParent.classList.contains('is-visible')) {
        // Already revealed (e.g. above the fold on load) — animate right away.
        runStatAnimations();
      } else {
        // Watch for the reveal observer adding "is-visible", then animate.
        const mo = new MutationObserver(() => {
          if (revealParent.classList.contains('is-visible')) {
            mo.disconnect();
            runStatAnimations();
          }
        });
        mo.observe(revealParent, { attributes: true, attributeFilter: ['class'] });
      }
    } else {
      // No reveal wrapper found — fall back to a simple viewport check.
      const fallbackObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          runStatAnimations();
          fallbackObs.disconnect();
        });
      }, { threshold: 0.2 });
      if (statRow) fallbackObs.observe(statRow);
    }
  }

  // Hero image: subtle 3D tilt on cursor
  const heroImageInner = document.querySelector('.hero-image-inner');
  const heroImage      = document.querySelector('.hero-image');
  if (heroImageInner && heroImage && !prefersReduced) {
    const onMove = e => {
      const rect  = heroImage.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      heroImageInner.style.transform = `rotateX(${dy * -6}deg) rotateY(${dx * 6}deg)`;
    };
    const onLeave = () => {
      heroImageInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };
    heroImage.addEventListener('mousemove', onMove);
    heroImage.addEventListener('mouseleave', onLeave);
  }

  // Button ripple
  if (!document.getElementById('ripple-kf')) {
    const s = document.createElement('style');
    s.id = 'ripple-kf';
    s.textContent = `@keyframes rippleOut { to { transform: scale(1); opacity: 0; } }`;
    document.head.appendChild(s);
  }
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      const r    = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const x    = e.clientX - r.left  - size / 2;
      const y    = e.clientY - r.top   - size / 2;
      const rpl  = document.createElement('span');
      rpl.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${size}px; height:${size}px; left:${x}px; top:${y}px;
        background:rgba(255,255,255,0.25);
        transform:scale(0); animation:rippleOut 0.55s ease-out forwards;
      `;
      btn.appendChild(rpl);
      rpl.addEventListener('animationend', () => rpl.remove());
    });
  });

  // Project card micro-interaction: subtle magnetic follow
  document.querySelectorAll('.project-card:not(.project-card--soon)').forEach(card => {
    if (prefersReduced || window.innerWidth < 769) return;
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / r.width;
      const dy = (e.clientY - r.top  - r.height / 2) / r.height;
      card.style.transform = `translateY(-10px) scale(1.005) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Contact channel: email copy-to-clipboard
  const emailChannel = document.querySelector('.contact-email[href^="mailto"]');
  if (emailChannel) {
    emailChannel.addEventListener('click', e => {
      // Let the native mailto open AND also copy to clipboard
      try {
        navigator.clipboard.writeText('drevesisaac@gmail.com');
        // Brief toast
        const toast = document.createElement('div');
        toast.textContent = 'Email copied!';
        toast.style.cssText = `
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: #18130F; color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem; font-weight: 700;
          padding: 0.65rem 1.4rem; border-radius: 4px;
          z-index: 9999; letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          animation: toastIn 0.28s ease, toastOut 0.28s ease 1.6s forwards;
          pointer-events: none;
        `;
        if (!document.getElementById('toast-kf')) {
          const ts = document.createElement('style');
          ts.id = 'toast-kf';
          ts.textContent = `
            @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
            @keyframes toastOut { from { opacity:1; } to { opacity:0; } }
          `;
          document.head.appendChild(ts);
        }
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      } catch (_) { /* clipboard blocked — mailto still fires */ }
    });
  }

  // Project photo carousel: wheel + arrows + dots
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track  = carousel.querySelector('[data-carousel-track]');
    const slides = Array.from(track.children);
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const dotsWrap = carousel.querySelector('[data-carousel-dots]');
    if (!track || slides.length === 0) return;

    // Single-image "carousels" don't need navigation chrome at all.
    if (slides.length <= 1) {
      prevBtn?.style.setProperty('display', 'none');
      nextBtn?.style.setProperty('display', 'none');
      dotsWrap?.style.setProperty('display', 'none');
      return;
    }

    // Build dots
    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'carousel-dot';
      d.setAttribute('aria-label', `Go to photo ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
      return d;
    });

    let activeIndex = 0;
    let isSyncing = false;

    const bump = btn => {
      btn.classList.remove('is-bump');
      // Force reflow so the animation can retrigger
      void btn.offsetWidth;
      btn.classList.add('is-bump');
    };

    const setActive = index => {
      activeIndex = index;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    };

    const goTo = index => {
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      isSyncing = true;
      slides[clamped].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setActive(clamped);
      window.clearTimeout(goTo._t);
      goTo._t = window.setTimeout(() => { isSyncing = false; }, 500);
    };

    prevBtn?.addEventListener('click', () => { bump(prevBtn); goTo(activeIndex - 1); });
    nextBtn?.addEventListener('click', () => { bump(nextBtn); goTo(activeIndex + 1); });

    // Keep dots/arrows in sync when the user drags or trackpad-scrolls the track directly
    let scrollRAF = null;
    track.addEventListener('scroll', () => {
      if (isSyncing) return;
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
      scrollRAF = requestAnimationFrame(() => {
        const trackRect = track.getBoundingClientRect();
        let closest = 0;
        let closestDist = Infinity;
        slides.forEach((slide, i) => {
          const dist = Math.abs(slide.getBoundingClientRect().left - trackRect.left);
          if (dist < closestDist) { closestDist = dist; closest = i; }
        });
        setActive(closest);
      });
    }, { passive: true });

    // Vertical mouse-wheel ↦ horizontal carousel navigation
    track.addEventListener('wheel', e => {
      // Only hijack mostly-vertical input; let horizontal trackpad gestures pass through
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (e.deltaY > 0) {
        if (activeIndex < slides.length - 1) { bump(nextBtn); goTo(activeIndex + 1); }
      } else {
        if (activeIndex > 0) { bump(prevBtn); goTo(activeIndex - 1); }
      }
    }, { passive: false });

    // Keyboard arrows when the carousel has focus
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { bump(nextBtn); goTo(activeIndex + 1); }
      else if (e.key === 'ArrowLeft') { bump(prevBtn); goTo(activeIndex - 1); }
    });

    setActive(0);
  });

});
