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

// Phone inputs — format digits into pairs as the user types (e.g.
// "0612345678" -> "06 12 34 56 78") so the number is easier to read.
document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    const pairs = digits.match(/.{1,2}/g) || [];
    input.value = pairs.join(' ');
  });
});

// Scroll-driven hero "un-zoom" (desktop only).
// As the gallery ("Nos Transformations") slides up over the pinned hero,
// the hero scales down and its corners round off. This is driven purely by
// scroll position — a 0..1 progress based on how far the gallery's top has
// crept over the viewport — so it reverses smoothly on scroll-up. Throttled
// with requestAnimationFrame and applied via CSS custom properties so the
// scaling stays GPU-accelerated instead of forcing layout.
const heroEl = document.querySelector('.hero');
const galleryEl = document.querySelector('.gallery');
const heroZoomMq = window.matchMedia('(min-width: 769px)');

if (heroEl && galleryEl) {
  let heroZoomTicking = false;

  function updateHeroZoom() {
    // Desktop only — clear the properties on mobile so nothing lingers.
    if (!heroZoomMq.matches) {
      heroEl.style.removeProperty('--hero-scale');
      heroEl.style.removeProperty('--hero-progress');
      return;
    }

    const galleryTop = galleryEl.getBoundingClientRect().top;
    const viewportHeight = window.innerHeight;

    // 0 when the gallery is still below the fold, 1 once its top reaches
    // the top of the viewport (i.e. it fully covers the hero).
    let progress = (viewportHeight - galleryTop) / viewportHeight;
    progress = Math.min(1, Math.max(0, progress));

    heroEl.style.setProperty('--hero-progress', progress.toFixed(4));
    heroEl.style.setProperty('--hero-scale', (1 - progress * 0.15).toFixed(4));
  }

  function requestHeroZoom() {
    if (!heroZoomTicking) {
      window.requestAnimationFrame(() => {
        updateHeroZoom();
        heroZoomTicking = false;
      });
      heroZoomTicking = true;
    }
  }

  window.addEventListener('scroll', requestHeroZoom, { passive: true });
  window.addEventListener('resize', requestHeroZoom);
  updateHeroZoom();
}
