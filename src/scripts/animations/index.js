// src/scripts/animations/index.js
import { initGSAP } from "../gsap-config.js";
import { initScrollReveal } from "./scroll-reveal.js";
import { initStaggerEffects } from "./stagger-effects.js";
import { initParallax } from "./parallax.js";
import { initHoverEffects } from "./hover-effects.js";

/**
 * Initialize all GSAP-based animations.
 * Call this once in app.js after DOMContentLoaded.
 */
export function initAnimations() {
  // Step 1: register GSAP globally + check reduced-motion
  initGSAP();

  // Step 2: initialize all animation modules
  initStaggerEffects();   // Featured + Notice (page-load)
  initParallax();         // Hero parallax
  initScrollReveal();     // PostCard + Footer + Pagination (scroll-triggered)
  initHoverEffects();     // PostCard hover (interaction-triggered)
}
