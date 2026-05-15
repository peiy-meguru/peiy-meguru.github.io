const THEME_MODE_KEY = "theme_mode";
const BG_LIGHT_KEY = "bg_light";
const BG_DARK_KEY = "bg_dark";

const MODES = ["system", "light", "dark"];
const BGS = ["white", "grid", "slideshow"];

const DARK_BG_COLOR = "#31363b";
const SLIDESHOW_INTERVAL_MS = 7000;

let slideshowTimer = null;
let mqlDark = null;

function safeGet(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* quota or private mode */ }
}

function safeRemove(key) {
  try { localStorage.removeItem(key); } catch (_) { /* private mode */ }
}

function effectiveIsDark() {
  const mode = safeGet(THEME_MODE_KEY, "system");
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getEffectiveBgKey() {
  return effectiveIsDark() ? BG_DARK_KEY : BG_LIGHT_KEY;
}

function stopSlideshow() {
  if (slideshowTimer !== null) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
}

function startSlideshow() {
  const images = window.SLIDESHOW_IMAGES;
  if (!images || !Array.isArray(images) || images.length === 0) return;

  const baseUrl = (window.SAKURA_BASE || "/").replace(/\/?$/, "/");
  const urls = images.map(
    (img) => baseUrl + "images/slideshow/" + img.replace(/^\/+/, "")
  );

  let index = 0;

  function cycle() {
    document.body.style.backgroundImage = `url(${urls[index]})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
    index = (index + 1) % urls.length;
  }

  cycle();
  slideshowTimer = setInterval(cycle, SLIDESHOW_INTERVAL_MS);
}

function clearSlideshowStyles() {
  document.body.style.backgroundImage = "";
  document.body.style.backgroundSize = "";
  document.body.style.backgroundPosition = "";
  document.body.style.backgroundAttachment = "";
}

function applyMode(mode) {
  const isDark = effectiveIsDark();
  const doc = document.documentElement;
  const body = document.body;

  MODES.forEach((m) => {
    doc.classList.remove("theme-" + m);
    body.classList.remove("theme-" + m);
  });

  doc.classList.add("theme-" + mode);
  body.classList.add("theme-" + mode);

  if (isDark) {
    doc.style.background = DARK_BG_COLOR;
  } else {
    doc.style.background = "";
  }
}

function applyBg(bg) {
  stopSlideshow();
  clearSlideshowStyles();

  BGS.forEach((b) => document.body.classList.remove("bg-" + b));
  for (const cls of [...document.body.classList]) {
    if (cls.startsWith("skin-")) document.body.classList.remove(cls);
  }

  document.body.classList.add("bg-" + bg);

  if (bg === "slideshow") {
    startSlideshow();
  }
}

function migrate() {
  if (safeGet(THEME_MODE_KEY, null)) return;

  let themeMode = "system";
  let bgLight = "white";
  const bgDark = "white";

  if (safeGet("dark", null) === "1") {
    themeMode = "dark";
  }

  const oldSkin = safeGet("skin", "");
  if (oldSkin === "grids") {
    bgLight = "grid";
  } else if (oldSkin === "bing") {
    bgLight = "slideshow";
  }

  safeSet(THEME_MODE_KEY, themeMode);
  safeSet(BG_LIGHT_KEY, bgLight);
  safeSet(BG_DARK_KEY, bgDark);

  safeRemove("dark");
  safeRemove("skin");
}

export function isDarkEffective() {
  return effectiveIsDark();
}

export function applyAntiFlicker() {
  if (effectiveIsDark()) {
    document.documentElement.classList.add("theme-dark");
    document.documentElement.style.background = DARK_BG_COLOR;
  }
}

export function initTheme() {
  migrate();

  const mode = safeGet(THEME_MODE_KEY, "system");
  applyMode(mode);
  applyBg(safeGet(getEffectiveBgKey(), "white"));

  if (mqlDark) {
    mqlDark.removeEventListener("change", onSystemPreferenceChange);
  }
  mqlDark = window.matchMedia("(prefers-color-scheme: dark)");
  mqlDark.addEventListener("change", onSystemPreferenceChange);
}

function onSystemPreferenceChange() {
  if (safeGet(THEME_MODE_KEY, "system") === "system") {
    applyMode("system");
    applyBg(safeGet(getEffectiveBgKey(), "white"));
  }
}

export function setMode(mode) {
  if (!MODES.includes(mode)) {
    console.warn("theme-engine: invalid mode:", mode);
    return;
  }
  safeSet(THEME_MODE_KEY, mode);
  applyMode(mode);
  applyBg(safeGet(getEffectiveBgKey(), "white"));
}

export function setBackground(bg) {
  if (!BGS.includes(bg)) {
    console.warn("theme-engine: invalid background:", bg);
    return;
  }
  safeSet(getEffectiveBgKey(), bg);
  applyBg(bg);
}

export function getCurrentMode() {
  return safeGet(THEME_MODE_KEY, "system");
}

export function getCurrentBackground() {
  return safeGet(getEffectiveBgKey(), "white");
}
