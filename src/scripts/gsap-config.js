// src/scripts/gsap-config.js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Global GSAP configuration.
 * Must be imported once before any animation modules use GSAP.
 */
export function initGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // Detect reduced-motion preference
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Disable all GSAP animations globally
    gsap.globalTimeline.timeScale(0);
    ScrollTrigger.defaults({ enabled: false });

    // Ensure all animated elements are visible
    document.querySelectorAll(".post-list-thumb, .feature-content li").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });

    console.info("[GSAP] Reduced motion detected: all animations disabled");
  }

  // Cleanup on page unload (Astro MPA navigation)
  window.addEventListener("beforeunload", () => {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.killTweensOf("*");
  });
}

export { gsap, ScrollTrigger };
