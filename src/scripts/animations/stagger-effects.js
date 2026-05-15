// src/scripts/animations/stagger-effects.js
import { gsap } from "../gsap-config.js";

export function initStaggerEffects() {
  // Featured cards stagger entrance
  const featureItems = document.querySelectorAll(".feature-content li");
  if (featureItems.length > 0) {
    gsap.from(featureItems, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power2.out",
      delay: 0.3,
    });
  }

  // Notice bar elastic entrance
  const notice = document.querySelector(".notice");
  if (notice) {
    gsap.from(notice, {
      y: -20,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.2)",
    });

    const noticeIcon = notice.querySelector("i");
    if (noticeIcon) {
      gsap.from(noticeIcon, {
        scale: 0.5,
        opacity: 0,
        duration: 0.4,
        delay: 0.2,
        ease: "back.out(2)",
      });
    }
  }
}
