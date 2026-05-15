// src/scripts/animations/scroll-reveal.js
import { gsap, ScrollTrigger } from "../gsap-config.js";

export function initScrollReveal() {
  // PostCard scroll reveal — batch for performance
  ScrollTrigger.batch(".post-list-thumb", {
    start: "top 85%",
    onEnter: (batch) => {
      gsap.fromTo(
        batch,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
    },
    once: true,
  });

  // Footer scroll reveal
  ScrollTrigger.batch(".site-footer > *", {
    start: "top 95%",
    onEnter: (batch) => {
      gsap.fromTo(
        batch,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    },
    once: true,
  });

  // Pagination navigator reveal
 // Now unused
  const navigator = document.querySelector(".navigator");
  if (navigator) {
    ScrollTrigger.create({
      trigger: navigator,
      start: "top 90%",
      onEnter: () => {
        gsap.from(".navigator a", {
          scale: 0.9,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(1.5)",
        });
      },
      once: true,
    });
  }
}
