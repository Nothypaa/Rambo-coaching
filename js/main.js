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
        .map((p, i) => {
          const link = p.link || PROFILE_URL;
          const alt = 'Publication Instagram n°' + (i + 1) +
            ' - coach sportif Montpellier (@rambo_coaching)';
          return (
            '<a href="' + link + '" class="instagram-post" target="_blank" ' +
            'rel="noopener noreferrer" aria-label="Voir la publication sur Instagram">' +
            '<img src="' + p.image + '" alt="' + alt + '" loading="lazy">' +
            '<span class="instagram-post-overlay">' + INSTAGRAM_ICON + '</span>' +
            '</a>'
          );
        })
        .join('');
    })
    .catch(() => { /* leave the feed empty on failure */ });
}

// Profile / trust section — rendered from the CMS-editable data file
// (data/profile.json): photo, bio blocks, stats and medal counts. Every
// number and text string lives in that file so it can be updated without
// touching markup. Leaves the section empty if the file is missing.
const profileVisual = document.querySelector('#profileVisual');
if (profileVisual) {
  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // Decorative only — the value + label beside each icon already say what it
  // means, so alt="" keeps screen readers from announcing it twice (same
  // convention as the qualify-list icons).
  const statIcon = (image) =>
    image
      ? '<span class="profile-stat-icon">' +
        '<img src="' + escapeHtml(image) + '" alt="" loading="lazy"></span>'
      : '';

  fetch('data/profile.json')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      if (!data) return;

      if (data.photo && data.photo.image) {
        profileVisual.innerHTML =
          '<img src="' + escapeHtml(data.photo.image) + '" alt="' +
          escapeHtml(data.photo.alt || '') + '" class="profile-photo" loading="lazy">';
      }

      const bio = document.querySelector('#profileBio');
      if (bio && Array.isArray(data.bio)) {
        bio.innerHTML = data.bio
          .filter((b) => b && b.text)
          .map(
            (b) =>
              '<div class="profile-bio-block">' +
              '<h3 class="profile-bio-heading">' + escapeHtml(b.heading || '') + '</h3>' +
              '<p class="profile-bio-text">' + escapeHtml(b.text) + '</p>' +
              '</div>'
          )
          .join('');
      }

      const stats = document.querySelector('#profileStats');
      if (stats && Array.isArray(data.stats)) {
        stats.innerHTML = data.stats
          .filter((s) => s && s.value)
          .map(
            (s) =>
              '<div class="profile-stat">' +
              statIcon(s.image) +
              '<span class="profile-stat-value">' + escapeHtml(s.value) + '</span>' +
              '<span class="profile-stat-label">' + escapeHtml(s.label || '') + '</span>' +
              '</div>'
          )
          .join('');
      }

      // Palmarès: one tight row per title, with the gold/silver tally counted
      // from the list itself so the totals can never drift from the entries.
      const medals = document.querySelector('#profileMedals');
      if (medals && Array.isArray(data.palmares)) {
        const icons = data.medalIcons || {};
        const titles = data.palmares.filter((t) => t && t.title);

        const tally = ['or', 'argent']
          .map((rank) => {
            const count = titles.filter((t) => t.rank === rank).length;
            const icon = icons[rank];
            if (!count || !icon || !icon.image) return '';
            return (
              '<span class="palmares-tally-item">' +
              '<img src="' + escapeHtml(icon.image) + '" alt="' +
              escapeHtml(icon.alt || '') + '" loading="lazy">' +
              escapeHtml(count) +
              '</span>'
            );
          })
          .join('');

        const rows = titles
          .map((t) => {
            const icon = icons[t.rank] || {};
            // alt="" — "Champion"/"Vice champion" in the row text already says
            // which medal it is, so the image would just repeat it.
            const medal = icon.image
              ? '<img class="palmares-medal" src="' + escapeHtml(icon.image) +
                '" alt="" loading="lazy">'
              : '';
            const meta = [t.category, t.year].filter(Boolean).join(' · ');
            return (
              '<li class="palmares-row">' +
              medal +
              '<span class="palmares-name">' + escapeHtml(t.title) + '</span>' +
              (meta ? '<span class="palmares-meta">' + escapeHtml(meta) + '</span>' : '') +
              '</li>'
            );
          })
          .join('');

        medals.innerHTML =
          '<div class="palmares-head">' +
          '<span class="palmares-heading">' +
          escapeHtml(data.palmaresTitle || 'Palmarès') + '</span>' +
          '<span class="palmares-tally">' + tally + '</span>' +
          '</div>' +
          '<ul class="palmares-list">' + rows + '</ul>';
      }
    })
    .catch(() => { /* leave the section empty on failure */ });
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
// The widget only appears once the visitor has scrolled past the hero, and
// after 45s on the site it auto-opens the popup once (a soft nudge). A manual
// close is remembered for the session so it doesn't nag.
const waWidget = document.querySelector('.whatsapp-widget');
if (waWidget) {
  const waToggle = waWidget.querySelector('.whatsapp-toggle');
  let waRevealed = false;
  let waAutoOpenReady = false;

  function setWhatsappOpen(open) {
    waWidget.classList.toggle('is-open', open);
    waToggle.setAttribute('aria-expanded', String(open));
    waToggle.setAttribute(
      'aria-label',
      open ? 'Fermer la discussion' : 'Ouvrir la discussion WhatsApp'
    );
  }

  // Auto-open once, only while the widget is actually visible and not dismissed.
  function maybeAutoOpenWhatsapp() {
    if (
      waRevealed &&
      waAutoOpenReady &&
      !sessionStorage.getItem('waDismissed') &&
      !waWidget.classList.contains('is-open')
    ) {
      waAutoOpenReady = false; // only nudge once
      setWhatsappOpen(true);
    }
  }

  // Reveal the widget once scrolled past (most of) the hero section.
  let waTicking = false;
  function updateWhatsappReveal() {
    const shouldReveal = window.scrollY > window.innerHeight * 0.8;
    if (shouldReveal === waRevealed) return;
    waRevealed = shouldReveal;
    waWidget.classList.toggle('is-revealed', shouldReveal);
    if (shouldReveal) {
      maybeAutoOpenWhatsapp();
    } else {
      setWhatsappOpen(false); // collapse the popup while it's hidden away
    }
  }
  function requestWhatsappReveal() {
    if (!waTicking) {
      window.requestAnimationFrame(() => {
        updateWhatsappReveal();
        waTicking = false;
      });
      waTicking = true;
    }
  }
  window.addEventListener('scroll', requestWhatsappReveal, { passive: true });
  window.addEventListener('resize', requestWhatsappReveal);
  updateWhatsappReveal();

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

  // After 45s on the site, arm the auto-open (fires as soon as the widget is
  // visible), unless the visitor has already dismissed it this session.
  if (!sessionStorage.getItem('waDismissed')) {
    window.setTimeout(() => {
      waAutoOpenReady = true;
      maybeAutoOpenWhatsapp();
    }, 45000);
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
