// Skin switcher UI — delegates to theme-engine.js for all state

import {
  setMode,
  setBackground,
  getCurrentMode,
  getCurrentBackground,
} from "./theme-engine.js";

export function initSkinSwitcher() {
  const skinMenu = document.querySelector(".skin-menu");
  const gear = document.querySelector(".changeSkin-gear");
  const gearTopBtn = document.getElementById("gear-top-btn");
  if (!skinMenu || !gear) return;

  function openMenu() {
    skinMenu.classList.add("show");
    gear.style.opacity = "0";
    gear.style.pointerEvents = "none";
    if (gearTopBtn) {
      gearTopBtn.style.opacity = "0";
      gearTopBtn.style.pointerEvents = "none";
    }
  }

  function closeMenu() {
    skinMenu.classList.remove("show");
    gear.style.opacity = "1";
    gear.style.pointerEvents = "auto";
    if (gearTopBtn) {
      gearTopBtn.style.opacity = "1";
      gearTopBtn.style.pointerEvents = "auto";
    }
  }

  gear.addEventListener("click", () => {
    skinMenu.classList.contains("show") ? closeMenu() : openMenu();
  });

  document.addEventListener("click", (e) => {
    if (!skinMenu.contains(e.target) && !gear.contains(e.target)) {
      closeMenu();
    }
  });

  // Mode buttons
  const modeContainer = skinMenu.querySelector(".theme-mode-controls");
  if (modeContainer) {
    modeContainer.querySelectorAll("button[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        setMode(mode);
        updateActiveStates();
        setTimeout(() => closeMenu(), 300);
      });
    });
  }

  // Background buttons
  const bgContainer = skinMenu.querySelector(".theme-bg-controls");
  if (bgContainer) {
    bgContainer.querySelectorAll("button[data-bg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bg = btn.dataset.bg;
        setBackground(bg);
        updateActiveStates();
        setTimeout(() => closeMenu(), 300);
      });
    });
  }

  // Font controls
  skinMenu.querySelectorAll(".font-family-controls button").forEach((btn) => {
    btn.addEventListener("click", () => {
      skinMenu
        .querySelectorAll(".font-family-controls button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      const mode = btn.dataset.mode;
      if (mode === "serif") {
        document.body.classList.add("serif");
        localStorage.setItem("font_family", "serif");
      } else {
        document.body.classList.remove("serif");
        localStorage.setItem("font_family", "sans-serif");
      }
    });
  });

  // Restore font state
  const savedFont = localStorage.getItem("font_family");
  if (savedFont === "serif") {
    document.body.classList.add("serif");
  } else {
    document.body.classList.remove("serif");
  }

  const activeMode = savedFont === "serif" ? "serif" : "sans-serif";
  const activeBtn = skinMenu.querySelector(`[data-mode="${activeMode}"]`);
  if (activeBtn) {
    skinMenu
      .querySelectorAll(".font-family-controls button")
      .forEach((b) => b.classList.remove("selected"));
    activeBtn.classList.add("selected");
  }

  function updateActiveStates() {
    const currentMode = getCurrentMode();
    const currentBg = getCurrentBackground();

    if (modeContainer) {
      modeContainer.querySelectorAll("button[data-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === currentMode);
      });
    }
    if (bgContainer) {
      bgContainer.querySelectorAll("button[data-bg]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.bg === currentBg);
      });
    }
  }

  updateActiveStates();
}
