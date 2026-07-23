# Rambo Coaching — Project Info

## Stack
Plain HTML / CSS / JS (static site, no backend). Contact form via Formspree (to be wired up later).

## Contact Info
- Phone: `07 67 07 43 32` (used in navbar CTA + hero CTA `tel:` links).

## Brand Colors
- Primary (red): `#9b0000`
- Dark/Black: `#1a1a1a`
- White: `#ffffff`

## Fonts
- Hero H1: bold/extra-bold condensed display sans (style shown in MyFonts screenshot — e.g. Tafel Sans BC Extra Bold / Budmo Solid).
  - Placeholder free equivalent in use: **Oswald** (Google Fonts, weight 600) — swap for the licensed font once purchased. (Originally tried Anton, but it was too bold/heavy.)
  - Body/UI font: TBD (not decided yet).

## Folder Structure
- `index.html` — homepage
- `css/style.css` — stylesheet
- `js/main.js` — nav/hamburger scripts
- `js/curved-carousel.js` — reusable curved photo carousel module
- `assets/logo/logo.png` — logo (transparent PNG)
- `assets/images/` — image assets (client will supply)
- `assets/images/gallery/` — photos for the curved carousel (`gallery-1.jpg` … `gallery-6.jpg`) — client to supply

## Placeholders to replace
- Formspree endpoint `https://formspree.io/f/YOUR_FORM_ID` in the hero contact form.
- Gallery photos in `assets/images/gallery/` (cards show as dark placeholders until added; add two at a time to keep the 1&2/3&4 dome pairing clean — see `js/curved-carousel.js`).
- Review text "Note de 5/5 sur plus de 50 avis".
- Lightbox CTA (`js/curved-carousel.js`, `CTA_HREF`) currently points to `#contact` — update to the real contact page once it's built.

## Status
- [x] Hero section markup + basic styling started
- [x] Nav / header
- [x] Hero contact form (desktop, ≥1024px) — Formspree endpoint still a placeholder
- [x] Curved photo carousel section with click-to-enlarge lightbox + CTA
- [ ] About section
- [ ] Services section
- [ ] Contact page/section (lightbox CTA + nav links point to `#contact`, not yet built)
- [ ] Contact form wired to real Formspree endpoint
- [ ] Footer
- [ ] SEO meta tags / favicon
