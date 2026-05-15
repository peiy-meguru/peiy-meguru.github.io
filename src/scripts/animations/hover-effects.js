// src/scripts/animations/hover-effects.js
import { gsap } from "../gsap-config.js";

export function initHoverEffects() {
  const cards = document.querySelectorAll(".post-list-thumb");

  cards.forEach((card) => {
    const img = card.querySelector(".post-thumb img");

    card.addEventListener("mouseenter", () => {
      // Match reference site: only box-shadow change, no Y translation
      gsap.to(card, {
        boxShadow: "0 5px 10px 5px rgba(110,110,110,.4)",
        duration: 0.3,
        ease: "power2.out",
      });
      if (img) {
        // Match reference: scale(1.2) rotate(5deg)
        gsap.to(img, {
          scale: 1.2,
          rotation: 5,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        boxShadow: "0 1px 20px -6px rgba(0,0,0,.5)",
        duration: 0.3,
        ease: "power2.out",
      });
      if (img) {
        gsap.to(img, {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });

    // Smart will-change management
    card.addEventListener("mouseenter", () => {
      card.style.willChange = "box-shadow";
      if (img) img.style.willChange = "transform";
    });
    card.addEventListener("mouseleave", () => {
      card.style.willChange = "auto";
      if (img) img.style.willChange = "auto";
    });
  });
}
