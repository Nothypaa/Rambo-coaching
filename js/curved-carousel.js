/* ============================================================
   Curved photo carousel — reusable module
   ------------------------------------------------------------
   A row of tall photos arranged in an upward dome (arch):
   trace the top edge of the row and it is HIGHEST at the middle
   photos and LOWEST at the outer top corners of the leftmost /
   rightmost photos, which tip outward and downward. Edge photos
   also bend away from the viewer (rotateY), shrink slightly and
   dim, like the row is wrapped around the inside of a cylinder.

   The dome is computed in exact screen coordinates: vertical
   position, tilt and size are all applied directly (no
   translateZ repositioning), so the curve cannot be distorted
   by perspective projection. Only rotateY uses the container's
   perspective, and it pivots each card around its own center.

   Motion: a paced slideshow — holds still for HOLD_S seconds,
   then glides two photo-widths (one PAIR) right -> left in a
   single eased motion, and repeats forever with no visible
   reset. On desktop this keeps a fixed pairing in the prime
   "middle of the dome" spot: photos 1&2 together, then 3&4,
   then 5&6, and so on as more photos are added (add them in
   pairs to keep the grouping clean). Card size is fixed, so
   adding more photos later doesn't shrink existing ones — the
   belt just gets a longer cycle.
   Keeps scrolling even while hovered (only pauses when the tab is
   hidden or the lightbox is open), with gentler geometry on mobile,
   and respects prefers-reduced-motion.

   Drop-in usage:
     1. Put a <div id="curvedCarousel"></div> on the page.
     2. Set the image list in GALLERY_IMAGES below (add photos
        two at a time to keep the 1&2 / 3&4 / 5&6 pairing).
     3. Include this file: <script src="js/curved-carousel.js"></script>
   ============================================================ */

(function () {
  // --- Photos to show ---
  // The list is loaded from the CMS-editable data file (data/gallery.json)
  // just before the carousel starts; these are the fallback defaults used
  // if that file can't be read.
  let GALLERY_IMAGES = [
    'assets/images/gallery/perte-de-poids-montpellier.jpg',
    'assets/images/gallery/musculation-montpellier.jpg',
    'assets/images/gallery/coach-sportif-montpellier.jpg',
    'assets/images/gallery/coach-de-musculation.jpg'
  ];

  const container = document.getElementById('curvedCarousel');
  if (!container) return;

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Lightbox: click a photo to see it enlarged -----
  // TODO: point this to the real contact page once it exists.
  const CTA_HREF = '#contact';

  const lightbox = document.createElement('div');
  lightbox.className = 'cc-lightbox';

  const lightboxContent = document.createElement('div');
  lightboxContent.className = 'cc-lightbox-content';

  const lightboxImg = document.createElement('img');

  const lightboxCta = document.createElement('a');
  lightboxCta.className = 'cc-lightbox-cta';
  lightboxCta.href = CTA_HREF;
  lightboxCta.textContent = 'Je veux les mêmes résultats';

  const lightboxClose = document.createElement('button');
  lightboxClose.className = 'cc-lightbox-close';
  lightboxClose.setAttribute('aria-label', 'Fermer');
  lightboxClose.textContent = '×';

  lightboxContent.appendChild(lightboxImg);
  lightboxContent.appendChild(lightboxCta);
  lightbox.appendChild(lightboxContent);
  lightbox.appendChild(lightboxClose);
  document.body.appendChild(lightbox);

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('is-open');
    paused = true; // hold the belt still while looking at the photo
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    if (!reduceMotion) paused = false;
  }

  lightbox.addEventListener('click', (e) => {
    // close on backdrop click, but not when clicking the photo itself
    if (e.target === lightbox) closeLightbox();
  });
  lightboxClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  // --- Slideshow pacing ---
  const HOLD_S = 4;   // seconds standing still between shifts
  const MOVE_S = 1.1; // seconds for one smooth shift

  // Tunable geometry, recalculated on resize for mobile vs desktop.
  let cardW, cardH, gap, amp, rot, bendY, shrink, dim;
  let step, span, shiftPx, baseTop, alignOffset;
  let cards = [];
  let offset = 0;        // how far the belt has travelled (px)
  let lastTs = 0;        // timestamp of previous frame
  let paused = false;
  let phase = 'hold';    // 'hold' (standing) or 'move' (gliding)
  let phaseT = 0;        // time spent in the current phase (s)
  let moveFrom = 0;      // offset at the start of the current glide
  let rafId = null;

  function configure() {
    const w = container.clientWidth;
    const mobile = w < 768;

    if (mobile) {
      // size from the viewport: one dominant centered photo with the
      // neighbors peeking in from both edges
      gap = 16;
      cardW = Math.max(180, Math.min(300, Math.round(w * 0.58)));
      cardH = Math.round(cardW * 1.4);
      amp = 26; rot = 4; bendY = 16; shrink = 0.06; dim = 0.15;
    } else {
      // Fixed size — does NOT depend on how many photos exist, so
      // adding more later never shrinks the ones already there.
      cardW = 340;   // photo width  (big — client work showcase)
      cardH = 460;   // photo height (tall)
      gap = 36;      // space between photos
      amp = 80;      // how far the outer photos sit LOWER (dome)
      rot = 7;       // outward-down tilt at the edges (deg)
      bendY = 28;    // rotateY at the edges (deg) — bends photos away
      shrink = 0.10; // edge photos up to this much smaller
      dim = 0.28;    // brightness falloff at the edges
    }

    step = cardW + gap;
    // Desktop: shift by a PAIR (2 cards) each cycle, so photos 1&2
    // stay together in the dome's middle, then 3&4 take their place,
    // then 5&6, etc. Mobile only ever shows one dominant card, so it
    // advances one photo at a time instead.
    shiftPx = mobile ? step : 2 * step;

    // Deterministic dome alignment (offset baseline, mod step):
    //  - mobile: one card sits EXACTLY at the apex of the dome
    //  - desktop: the apex falls midway between the two middle cards
    // Shifts move by whole steps, so this alignment never drifts,
    // and pairs always land as (1,2), (3,4), (5,6)...
    alignOffset = mobile
      ? cardW / 2 - w / 2
      : cardW / 2 - w / 2 + step / 2;

    const stageH = cardH + amp + 48;
    container.style.height = stageH + 'px';
    baseTop = 24; // top edge of the middle (highest) photo
  }

  function alignBelt() {
    // Start the belt on the alignment baseline, wrapped by the FULL
    // belt length (span), not by a single step. Reducing modulo a
    // single step would preserve the visual phase but scramble which
    // absolute index (even/odd) lands there, breaking the 1&2 / 3&4
    // pairing. Wrapping by span (a multiple of step) keeps the exact
    // index parity intact.
    offset = ((alignOffset % span) + span) % span;
  }

  function build() {
    cards.forEach((c) => c.remove());
    cards = [];

    const w = container.clientWidth;
    // enough cards to cover the viewport plus a buffer on each side —
    // if there are more photos than fit, they cycle in via the loop;
    // if there are fewer, the list repeats to fill the belt
    const needed = Math.ceil((w + 2 * step) / step) + 1;
    let count = Math.max(needed, GALLERY_IMAGES.length);
    // keep the belt length pair-safe so 1&2/3&4 grouping survives
    // the wrap-around at the end of a full cycle
    if (count % 2 !== 0) count++;

    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'cc-card';
      card.style.width = cardW + 'px';
      card.style.height = cardH + 'px';

      const photoIndex = (i % GALLERY_IMAGES.length) + 1;
      const src = GALLERY_IMAGES[i % GALLERY_IMAGES.length];
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Transformation physique n°' + photoIndex + ' - coach musculation Montpellier, perte de poids et prise de muscle';
      img.loading = 'lazy';
      // if a photo is missing, hide the <img> so the card still
      // shows as a clean dark placeholder (curve + motion visible)
      img.addEventListener('error', () => { img.style.display = 'none'; });

      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openLightbox(src));

      // Zoom hint: a small always-visible badge so people know the
      // photo is clickable (works on touch too, where hover doesn't).
      const zoomHint = document.createElement('div');
      zoomHint.className = 'cc-zoom-hint';
      zoomHint.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"></circle>' +
        '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
        '</svg>';

      card.appendChild(img);
      card.appendChild(zoomHint);
      container.appendChild(card);
      cards.push(card);
    }

    span = count * step; // one full loop of the belt
  }

  // wrap a value into the range [min, max) so the belt loops seamlessly
  function wrap(value, min, max) {
    const range = max - min;
    return ((value - min) % range + range) % range + min;
  }

  function easeInOutCubic(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  function render() {
    const w = container.clientWidth;
    const halfW = w / 2;
    const min = -step;                // just off the left edge
    const max = min + span;           // wraps beyond the right edge

    for (let i = 0; i < cards.length; i++) {
      // position along the belt, wrapped so it loops off-screen
      const x = wrap(i * step - offset, min, max);
      const center = x + cardW / 2;

      // t: -1 at the left edge, 0 in the middle, +1 at the right edge
      const t = (center - halfW) / halfW;
      // clamp so off-screen buffer cards don't get extreme values
      const tc = Math.max(-1.15, Math.min(1.15, t));

      // ----- Upward dome, in exact screen coordinates -----
      // Vertical: y grows DOWNWARD on screen, so +amp*t^2 places the
      // outer photos LOWER; the middle photo (t=0) sits highest.
      const y = baseTop + amp * tc * tc;
      // In-plane tilt: rot*t is clockwise (+) on the right card and
      // counterclockwise (-) on the left card, so each OUTER top
      // corner drops DOWN and outward — never up.
      const rz = rot * tc;
      // Depth cues that cannot move the card vertically:
      const ry = bendY * tc;               // bend away from the viewer
      const s = 1 - shrink * tc * tc;      // edges slightly smaller

      const card = cards[i];
      card.style.transform =
        'translate3d(' + x + 'px, ' + y + 'px, 0)' +
        ' rotateY(' + ry + 'deg) rotate(' + rz + 'deg) scale(' + s + ')';
      // edge photos sit dimmer, like they're farther from the light/eye
      card.style.filter = 'brightness(' + (1 - dim * tc * tc).toFixed(3) + ')';
      // middle photos overlap on top of the outer ones
      card.style.zIndex = String(Math.round(100 - tc * tc * 100));
    }
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    // clamp dt so a background tab doesn't cause a giant jump
    const dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;

    if (!paused) {
      phaseT += dt;

      if (phase === 'hold' && phaseT >= HOLD_S) {
        phase = 'move';
        phaseT = 0;
        moveFrom = offset;
      }

      if (phase === 'move') {
        const p = Math.min(phaseT / MOVE_S, 1);
        offset = moveFrom + shiftPx * easeInOutCubic(p);
        if (p >= 1) {
          phase = 'hold';
          phaseT = 0;
          offset = ((offset % span) + span) % span; // keep numbers small
        }
      }
    }

    render();
    rafId = requestAnimationFrame(tick);
  }

  // Pause when the tab is not visible (saves battery/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      paused = true;
    } else if (!reduceMotion) {
      paused = false;
      lastTs = 0; // avoid a big jump after being hidden
    }
  });

  // Rebuild on resize (debounced) to switch mobile/desktop sizing
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      configure();
      build();
      // restart the cycle cleanly with the new geometry
      phase = 'hold';
      phaseT = 0;
      alignBelt();
      render();
    }, 150);
  });

  // Init — start the carousel once the geometry is set up.
  function start() {
    configure();
    build();
    alignBelt();
    render();
    if (reduceMotion) {
      paused = true; // hold still, but keep the curve
    }
    rafId = requestAnimationFrame(tick);
  }

  // Load the (CMS-editable) photo list, then start. Falls back to the
  // built-in defaults above if the data file is missing or malformed.
  fetch('data/gallery.json')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const list = (data && Array.isArray(data.images) ? data.images : [])
        .map((it) => (typeof it === 'string' ? it : it && it.image))
        .filter(Boolean);
      if (list.length) GALLERY_IMAGES = list;
    })
    .catch(() => { /* keep the built-in defaults */ })
    .finally(start);
})();
