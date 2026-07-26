// Rambo Coaching — main JS

const navbarToggle = document.querySelector('.navbar-toggle');
const navbarLinks = document.querySelector('.navbar-links');

navbarToggle.addEventListener('click', () => {
  const isOpen = navbarLinks.classList.toggle('is-open');
  navbarToggle.classList.toggle('is-active', isOpen);
  navbarToggle.setAttribute('aria-expanded', isOpen);
});

// Navbar background only appears once the page is scrolled — stays
// transparent at the very top.
const navbar = document.querySelector('.navbar');
function updateNavbarBackground() {
  navbar.classList.toggle('is-scrolled', window.scrollY > 50);
}
window.addEventListener('scroll', updateNavbarBackground);
updateNavbarBackground();

// Contact modal — opened by any [data-open-contact] trigger.
const contactModal = document.querySelector('#contactModal');
const contactModalCard = contactModal.querySelector('.contact-modal-card');
const contactModalClose = contactModal.querySelector('.contact-modal-close');

function openContactModal() {
  contactModal.classList.add('is-open');
  contactModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  // Close the mobile nav menu if it's open (the Contact link lives inside it).
  navbarLinks.classList.remove('is-open');
  navbarToggle.classList.remove('is-active');
  navbarToggle.setAttribute('aria-expanded', 'false');
}

function closeContactModal() {
  contactModal.classList.remove('is-open');
  contactModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('[data-open-contact]').forEach((trigger) => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openContactModal();
  });
});

contactModalClose.addEventListener('click', closeContactModal);

// Click outside the card (on the dimmed overlay) closes the modal.
contactModal.addEventListener('click', (e) => {
  if (!contactModalCard.contains(e.target)) {
    closeContactModal();
  }
});

// Escape key closes the modal.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && contactModal.classList.contains('is-open')) {
    closeContactModal();
  }
});

// Instagram feed — rendered from the CMS-editable data file
// (data/instagram.json). Each post is an image linking to Instagram, with
// the hover overlay + icon. Falls back to an empty feed if the file is
// missing or malformed.
const instagramFeed = document.querySelector('#instagramFeed');
if (instagramFeed) {
  const INSTAGRAM_ICON =
    '<svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="2" y="2" width="20" height="20" rx="5"/>' +
    '<circle cx="12" cy="12" r="4"/>' +
    '<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>' +
    '</svg>';
  const PROFILE_URL = 'https://www.instagram.com/rambo_coaching';

  fetch('data/instagram.json')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const posts = data && Array.isArray(data.posts) ? data.posts : [];
      instagramFeed.innerHTML = posts
        .filter((p) => p && p.image)
        .map((p) => {
          const link = p.link || PROFILE_URL;
          return (
            '<a href="' + link + '" class="instagram-post" target="_blank" ' +
            'rel="noopener noreferrer" aria-label="Voir la publication sur Instagram">' +
            '<img src="' + p.image + '" alt="Publication Instagram Rambo Coaching">' +
            '<span class="instagram-post-overlay">' + INSTAGRAM_ICON + '</span>' +
            '</a>'
          );
        })
        .join('');
    })
    .catch(() => { /* leave the feed empty on failure */ });
}

// Phone inputs — format digits into pairs as the user types (e.g.
// "0612345678" -> "06 12 34 56 78") so the number is easier to read.
document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    const pairs = digits.match(/.{1,2}/g) || [];
    input.value = pairs.join(' ');
  });
});

// Scroll-driven "un-zoom" curtain transitions (desktop only).
// A pinned section holds still while the next section — the "curtain" — rises
// up over it; the pinned content scales down (100% -> 85%) and its corners
// round off (24px -> 44px, done in CSS from the same --*-progress value). It's
// driven purely by scroll position — a 0..1 progress based on how far the
// curtain's top has crept up the viewport — so it reverses smoothly on
// scroll-up. Used for both hero->gallery and instagram->footer so the two
// transitions share one easing/scale/radius. Throttled with
// requestAnimationFrame and applied via CSS custom properties so the scaling
// stays GPU-accelerated instead of forcing layout.
const unzoomMq = window.matchMedia('(min-width: 769px)');

function setupPinnedUnzoom(scaleEl, curtainEl, prefix) {
  if (!scaleEl || !curtainEl) return;

  const scaleVar = '--' + prefix + '-scale';
  const progressVar = '--' + prefix + '-progress';
  let ticking = false;

  function update() {
    // Desktop only — clear the properties on mobile so nothing lingers.
    if (!unzoomMq.matches) {
      scaleEl.style.removeProperty(scaleVar);
      scaleEl.style.removeProperty(progressVar);
      return;
    }

    const curtainTop = curtainEl.getBoundingClientRect().top;
    const viewportHeight = window.innerHeight;

    // 0 when the curtain is still below the fold, 1 once its top reaches the
    // top of the viewport (i.e. it fully covers the pinned section).
    let progress = (viewportHeight - curtainTop) / viewportHeight;
    progress = Math.min(1, Math.max(0, progress));

    scaleEl.style.setProperty(progressVar, progress.toFixed(4));
    scaleEl.style.setProperty(scaleVar, (1 - progress * 0.15).toFixed(4));
  }

  function request() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}

// hero -> "Nos Transformations" gallery
setupPinnedUnzoom(
  document.querySelector('.hero'),
  document.querySelector('.gallery'),
  'hero'
);

// Instagram section -> footer
setupPinnedUnzoom(
  document.querySelector('.instagram-inner'),
  document.querySelector('.site-footer'),
  'insta'
);

// Floating WhatsApp chat widget — the toggle morphs between the WhatsApp
// glyph and an X, opening/closing the popup (card + "Discutez avec moi").
// It auto-opens once shortly after load to invite contact, but if the
// visitor dismisses it we remember that for the session so it doesn't nag.
const waWidget = document.querySelector('.whatsapp-widget');
if (waWidget) {
  const waToggle = waWidget.querySelector('.whatsapp-toggle');

  function setWhatsappOpen(open) {
    waWidget.classList.toggle('is-open', open);
    waToggle.setAttribute('aria-expanded', String(open));
    waToggle.setAttribute(
      'aria-label',
      open ? 'Fermer la discussion' : 'Ouvrir la discussion WhatsApp'
    );
  }

  waToggle.addEventListener('click', () => {
    const willOpen = !waWidget.classList.contains('is-open');
    setWhatsappOpen(willOpen);
    // Remember a manual close so it stays collapsed for the rest of the visit.
    if (willOpen) {
      sessionStorage.removeItem('waDismissed');
    } else {
      sessionStorage.setItem('waDismissed', '1');
    }
  });

  // Auto-open once after the visitor has been on the site for 45 seconds
  // (a soft nudge to reach out), unless they've already dismissed it.
  if (!sessionStorage.getItem('waDismissed')) {
    window.setTimeout(() => setWhatsappOpen(true), 45000);
  }
}

// Hero form scarcity count — shows a believable "X places left" that changes
// automatically each month (same for every visitor within a given month).
// It's a hand-tuned marketing figure, not a real inventory count: one value
// per calendar month (Jan..Dec), picked by the visitor's current month.
const heroPlacesEl = document.querySelector('#heroPlaces');
if (heroPlacesEl) {
  const PLACES_BY_MONTH = [5, 4, 6, 3, 7, 5, 4, 8, 6, 4, 5, 3];
  const n = PLACES_BY_MONTH[new Date().getMonth()];
  heroPlacesEl.textContent = n + (n > 1 ? ' places' : ' place');
}
