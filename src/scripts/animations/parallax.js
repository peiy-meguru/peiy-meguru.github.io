// src/scripts/animations/parallax.js
// Uses raw scroll listener for reliability

let rafId = null;

export function initParallax() {
  const headertop = document.querySelector(".headertop");
  const centerbg = document.getElementById("centerbg");
  const focusinfo = document.querySelector(".focusinfo");
  if (!headertop) return;

  window.addEventListener(
    "scroll",
    () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;

        // Disable parallax transforms on mobile to avoid visual glitches
        // when background-attachment is scroll (iOS fixed-bg bug workaround)
        if (window.innerWidth <= 640) {
          if (centerbg) centerbg.style.transform = "";
          if (focusinfo) focusinfo.style.setProperty("--parallax-y", "0px");
          return;
        }

        const heroRect = headertop.getBoundingClientRect();

      // Hero fully off-screen above or below — reset
      if (heroRect.bottom <= 0 || heroRect.top >= 0) {
        if (centerbg) centerbg.style.transform = "";
        if (focusinfo) focusinfo.style.setProperty("--parallax-y", "0px");
        return;
      }

      const progress = Math.abs(heroRect.top) / heroRect.height;

      // Background: moves down with scroll (0% → 30%)
      if (centerbg) {
        const bgPct = Math.min(progress * 30, 30);
        centerbg.style.transform = bgPct < 0.1 ? "" : `translateY(${bgPct}%)`;
      }

      // Title: moves up with scroll
      if (focusinfo) {
        const titleOffset = Math.min(progress * focusinfo.offsetHeight * -0.15, 0);
        focusinfo.style.setProperty("--parallax-y", Math.abs(titleOffset) < 1 ? "0px" : `${titleOffset}px`);
      }
      });
    },
    { passive: true }
  );
}
