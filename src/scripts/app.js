// Main entry point — initializes all interactive modules

import { initTheme, setMode, getCurrentMode } from "./theme-engine.js";
import { initSkinSwitcher } from "./skin-switcher.js";
import { initSearch } from "./search.js";
import { initAPlayer } from "./aplayer.js";
import { initAnimations } from "./animations/index.js";
import hljs from "highlight.js";
import baguetteBox from "baguettebox.js";
import ClipboardJS from "clipboard";
import tocbot from "tocbot";

function revealAllContent() {
  document.querySelectorAll(".post-list-thumb, .feature-content li").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
}

function initPage() {
  initNavToggle();
  initHeaderScroll();
  initProgressBar();
  initScrollButtons();
  initTheme();
  initSkinSwitcher();
  initSearch();
  initLazyLoad();
  initImageLoadTracking();
  initHighlight();
  initLightbox();
  initClipboard();
  initToc();
  initAPlayer();
  initVideoHero();
  initMobileThemeToggle();
  initNavBehavior();

  // Initialize all GSAP animations
  try {
    initAnimations();
  } catch (e) {
    console.warn("[Animations] GSAP initialization failed:", e);
    revealAllContent();
  }

  // Safety fallback: force content visible if GSAP left it hidden
  setTimeout(() => {
    document.querySelectorAll(".post-list-thumb, .feature-content li").forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.opacity === "0") {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    });
  }, 3000);
}

document.addEventListener("DOMContentLoaded", initPage);
document.addEventListener("astro:after-swap", initPage);

// Fallback: if view transition leaves page contentless, force reload
document.addEventListener("astro:after-swap", () => {
  const content = document.querySelector("#content, .site-content");
  if (!content || content.children.length === 0 || document.body.innerHTML.length < 1000) {
    console.warn("[Router] View transition left empty content, hard reloading");
    location.reload();
  }
});
/* ===== Mobile Theme Toggle ===== */
function initMobileThemeToggle() {
  const btn = document.getElementById("moblieDarkLight");
  if (!btn) return;

  function updateIcon() {
    const effective = getCurrentMode();
    btn.innerHTML = effective === "dark"
      ? '<i class="fa fa-sun-o" aria-hidden="true"></i>'
      : '<i class="fa fa-moon-o" aria-hidden="true"></i>';
  }

  updateIcon();

  btn.addEventListener("click", () => {
    const current = getCurrentMode();
    setMode(current === "dark" ? "light" : "dark");
    updateIcon();
  });

  new MutationObserver(updateIcon).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

/* ===== Navigation Toggle (Hamburger) ===== */
function initNavToggle() {
  const showNav = document.getElementById("show-nav");
  const nav = document.querySelector(".site-top .lower nav");
  if (!showNav || !nav) return;

  showNav.addEventListener("click", () => {
    if (showNav.classList.contains("showNav")) {
      showNav.classList.remove("showNav");
      showNav.classList.add("hideNav");
      nav.classList.add("navbar");
    } else {
      showNav.classList.remove("hideNav");
      showNav.classList.add("showNav");
      nav.classList.remove("navbar");
    }
  });
}

/* ===== Header Scroll ===== */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header || document.body.clientWidth <= 640) return;

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    if (scrollTop > 0) {
      header.classList.add("yya");
    } else {
      header.classList.remove("yya");
    }
  });
}

/* ===== Progress Bar ===== */
function initProgressBar() {
  const bar = document.getElementById("bar");
  if (!bar) return;

  window.addEventListener("scroll", () => {
    const s = window.scrollY;
    const a = document.documentElement.scrollHeight;
    const b = window.innerHeight;
    const result = Math.min(Math.round((s / (a - b)) * 100), 100);
    bar.style.width = result + "%";
  });
}

/* ===== Scroll Buttons ===== */
function initScrollButtons() {
  const pcTop = document.querySelector(".cd-top");
  const mbTop = document.getElementById("moblieGoTop");
  const skinGear = document.querySelector(".changeSkin-gear");
  const gearTopBtn = document.getElementById("gear-top-btn");
  const musicToggle = document.getElementById("music-widget-toggle");
  const musicWidget = document.getElementById("music-widget");

  function updateVisibility() {
    const scrollTop = window.scrollY;
    const cwidth = document.body.clientWidth;

    if (cwidth <= 640) {
      if (scrollTop > 20) {
        if (mbTop) mbTop.style.transform = "scale(1)";
      } else {
        if (mbTop) mbTop.style.transform = "scale(0)";
      }
    } else {
      if (scrollTop > 100 || (musicWidget && musicWidget.classList.contains("open"))) {
        if (pcTop) pcTop.classList.add("cd-is-visible");
        if (skinGear) skinGear.style.opacity = "1";
        if (gearTopBtn) {
          gearTopBtn.style.opacity = "1";
          gearTopBtn.style.pointerEvents = "auto";
        }
        if (musicToggle) {
          musicToggle.style.opacity = "1";
          musicToggle.style.pointerEvents = "auto";
        }
      } else {
        if (skinGear) skinGear.style.opacity = "0";
        if (gearTopBtn) {
          gearTopBtn.style.opacity = "0";
          gearTopBtn.style.pointerEvents = "none";
        }
        if (musicToggle) {
          musicToggle.style.opacity = "0";
          musicToggle.style.pointerEvents = "none";
        }
        if (pcTop) {
          pcTop.style.top = "-999px";
          pcTop.classList.remove("cd-fade-out", "cd-is-visible");
        }
      }
      if (scrollTop > 1200) {
        if (pcTop) pcTop.classList.add("cd-fade-out");
      }
    }
  }

  updateVisibility();
  window.addEventListener("scroll", updateVisibility);

  if (pcTop) {
    pcTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  if (mbTop) {
    mbTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  if (gearTopBtn) {
    gearTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

/* ===== Lazy Loading with Streaming Display ===== */
function initLazyLoad() {
  const images = document.querySelectorAll("img[data-src], .img-main[data-src]");

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src || img.src;

            // Skip if already loaded or no src
            if (!src || img.classList.contains("loaded")) {
              observer.unobserve(img);
              return;
            }

            // Preload image off-screen
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = src;
              img.classList.add("loaded");
              img.removeAttribute("data-src");
            };
            tempImg.onerror = () => {
              img.onerror = null;
            };
            tempImg.src = src;

            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    images.forEach((img) => imageObserver.observe(img));
  } else {
    images.forEach((img) => {
      const src = img.dataset.src || img.src;
      if (src) {
        img.src = src;
        img.classList.add("loaded");
      }
    });
  }
}

/* ===== Mark existing images as loaded when they finish loading ===== */
function initImageLoadTracking() {
  document.querySelectorAll(".img-main").forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add("loaded");
    } else {
      img.addEventListener("load", () => {
        img.classList.add("loaded");
      });
      img.addEventListener("error", () => {
        img.classList.add("loaded");
      });
    }
  });
}

/* ===== Code Syntax Highlighting ===== */
function initHighlight() {
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
}

/* ===== Image Lightbox ===== */
function initLightbox() {
  const entry = document.querySelector(".entry-content");
  if (!entry) return;

  entry.querySelectorAll("img").forEach((img) => {
    if (img.closest("a")) return;
    const a = document.createElement("a");
    a.href = img.src;
    a.setAttribute("data-caption", img.alt || "");
    img.parentNode.insertBefore(a, img);
    a.appendChild(img);
  });

  baguetteBox.run(".entry-content", {
    captions: true,
    animation: "fadeIn",
  });
}

/* ===== Code Copy Buttons ===== */
function initClipboard() {
  document.querySelectorAll("pre").forEach((pre) => {
    const button = document.createElement("button");
    button.className = "copy-btn";
    button.textContent = "复制";
    pre.style.position = "relative";
    pre.appendChild(button);

    new ClipboardJS(button, {
      text: () => {
        const code = pre.querySelector("code");
        return code ? code.textContent || "" : "";
      },
    }).on("success", () => {
      button.textContent = "已复制";
      setTimeout(() => {
        button.textContent = "复制";
      }, 2000);
    });
  });
}

/* ===== Table of Contents ===== */
function initToc() {
  const tocContainer = document.querySelector(".toc");
  if (!tocContainer) return;

  tocbot.init({
    tocSelector: ".toc-details .toc",
    contentSelector: ".entry-content",
    headingSelector: "h1, h2, h3",
    hasInnerContainers: true,
    scrollSmooth: true,
  });
}

/* ===== Video Hero Controls ===== */
function initVideoHero() {
  const video = document.getElementById("bgvideo");
  const btn = document.getElementById("video-btn");
  const hero = document.getElementById("hero-headertop");
  const header = document.querySelector(".site-header");
  const progress = document.getElementById("video-progress");
  const progressFilled = document.getElementById("video-progress-filled");
  if (!video || !btn || !hero) return;

  // State: image | playing | paused
  function enterVideoMode() {
    hero.classList.add("playing");
    header.classList.add("video-active");
  }

  function exitVideoMode() {
    hero.classList.remove("playing");
    hero.classList.remove("peek");
    header.classList.remove("video-active");
    header.classList.remove("yya");
    progressFilled && (progressFilled.style.width = "0%");
  }

  function togglePause() {
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (hero.classList.contains("playing")) return;
    enterVideoMode();
    video.play().catch(() => {});
  });

  video.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!hero.classList.contains("playing")) return;
    togglePause();
  });

  // Video time update → progress bar
  video.addEventListener("timeupdate", () => {
    if (video.duration && progressFilled) {
      const pct = (video.currentTime / video.duration) * 100;
      progressFilled.style.width = pct + "%";
    }
  });

  // Click/drag progress bar to seek
  if (progress && progressFilled) {
    progress.addEventListener("click", (e) => {
      const rect = progress.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      video.currentTime = video.duration * pct;
    });

    let dragging = false;
    progress.addEventListener("mousedown", (e) => {
      dragging = true;
      const rect = progress.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      video.currentTime = video.duration * pct;
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const rect = progress.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = video.duration * pct;
    });
    document.addEventListener("mouseup", () => { dragging = false; });
  }

  // Only return to image when video ends
  video.addEventListener("ended", () => {
    exitVideoMode();
  });
}

/* ===== Nav Behavior: hide on homepage, show after scroll ===== */
function initNavBehavior() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const isHomepage = document.body.classList.contains('is-homepage');
  if (!isHomepage) {
    header.classList.add('is-visible');
    return;
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.classList.add('is-visible');
    } else {
      header.classList.remove('is-visible');
    }
  }, { passive: true });
}
