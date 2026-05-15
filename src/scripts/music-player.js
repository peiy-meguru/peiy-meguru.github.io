// Music Player — full-screen immersive player page

let apInstance = null;
let playlistSongs = [];
let rafId = null;
let keydownHandler = null;
let currentPlaylistFile = null;
let loadController = null;

export function initMusicPlayer() {
  const container = document.getElementById("mp-aplayer");
  const bgEl = document.getElementById("mp-bg");
  const coverEl = document.getElementById("mp-cover");
  const titleEl = document.getElementById("mp-title");
  const artistEl = document.getElementById("mp-artist");
  const progressBar = document.getElementById("mp-progress-bar");
  const progressFill = document.getElementById("mp-progress-fill");
  const currentTimeEl = document.getElementById("mp-current-time");
  const durationEl = document.getElementById("mp-duration");
  const playlistDropdown = document.getElementById("mp-playlist-dropdown");
  const playlistTrigger = document.getElementById("mp-playlist-trigger");
  const playlistLabel = document.getElementById("mp-playlist-label");
  const playlistMenu = document.getElementById("mp-playlist-menu");
  const playlistCount = document.getElementById("mp-playlist-count");
  const playlistEl = document.getElementById("mp-playlist");

  if (!container || !bgEl || !coverEl || !titleEl || !artistEl || !progressBar || !progressFill || !currentTimeEl || !durationEl || !playlistDropdown || !playlistTrigger || !playlistLabel || !playlistMenu || !playlistCount || !playlistEl) return;

  const baseUrl = (window.SAKURA_BASE || "/").replace(/\/?$/, "/");

  async function init() {
    await loadPlaylistManifest();
    await createAPlayer();
    await loadDefaultPlaylist();
  }

  // ----- Custom dropdown -----

  let dropdownOpen = false;

  function openDropdown() {
    dropdownOpen = true;
    playlistDropdown.classList.add("open");
  }
  function closeDropdown() {
    dropdownOpen = false;
    playlistDropdown.classList.remove("open");
  }

  playlistTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownOpen ? closeDropdown() : openDropdown();
  });

  document.addEventListener("click", (e) => {
    if (dropdownOpen && !playlistDropdown.contains(e.target)) closeDropdown();
  });

  async function loadPlaylistManifest() {
    try {
      const resp = await fetch(`${baseUrl}playlists.json`);
      if (!resp.ok) throw new Error("no manifest");
      const playlists = await resp.json();
      if (!playlists || playlists.length === 0) throw new Error("empty manifest");

      playlistMenu.innerHTML = "";
      playlistLabel.textContent = playlists[0].name;
      currentPlaylistFile = playlists[0].file;

      playlists.forEach((pl) => {
        const div = document.createElement("div");
        div.className = "mp-playlist-dropdown-item";
        div.textContent = pl.name;
        div.addEventListener("click", (e) => {
          e.stopPropagation();
          playlistLabel.textContent = pl.name;
          currentPlaylistFile = pl.file;
          closeDropdown();
          loadPlaylistFile(pl.file);
        });
        playlistMenu.appendChild(div);
      });
      playlistMenu.querySelector(".mp-playlist-dropdown-item")?.classList.add("active");
    } catch {
      playlistLabel.textContent = "无可用歌单";
    }
  }

  // ----- APlayer -----

  async function createAPlayer() {
    try {
      const { default: APlayer } = await import("aplayer");
      apInstance = new APlayer({
        container, mini: false, fixed: false, theme: "#E67474",
        autoplay: false, mutex: true, lrcType: 0, listFolded: true,
        preload: "auto", loop: "all", order: "list", storageName: "sakura-mp", audio: [],
      });
      apInstance.on("play", updateUI);
      apInstance.on("pause", updateUI);
      apInstance.on("ended", updateUI);
      apInstance.on("listswitch", onListSwitch);
    } catch (err) {
      console.error("Failed to create APlayer:", err);
    }
  }

  function onListSwitch() {
    // APlayer fires listswitch before updating list.index.
    // Defer to microtask so we read the post-switch index.
    Promise.resolve().then(() => {
      updatePlaylistActive();
      updateUI();
    });
  }

  async function loadDefaultPlaylist() {
    loadController = new AbortController();
    const { signal } = loadController;
    if (currentPlaylistFile) {
      await loadPlaylistFile(currentPlaylistFile);
    } else {
      await fallbackLoad(signal);
    }
  }

  // ----- Playlist loading (AbortController, newest always wins) -----

  async function loadPlaylistFile(file) {
    if (!apInstance) return;

    // Abort any in-flight load immediately
    if (loadController) loadController.abort();
    loadController = new AbortController();
    const { signal } = loadController;

    // Reset state
    playlistSongs = [];
    apInstance.list.clear();
    showSpinner();

    const ids = await readIdsFromPlaylistFile(file, signal);
    if (signal.aborted) return;
    if (ids.length === 0) {
      await fallbackLoad(signal);
      return;
    }

    const songs = await fetchAllSongs(ids, signal);
    if (signal.aborted) return;

    if (songs.length === 0) {
      await fallbackLoad(signal);
      return;
    }

    playlistSongs = songs;
    apInstance.list.clear();
    apInstance.list.add(songs);
    renderPlaylist();
    updateUI();
  }

  // ----- Song fetching (parallel, abortable) -----

  const METING_APIS = [
    "https://api.i-meto.com/meting/api",
    "https://meting.qjqq.cn/api",
  ];

  async function fetchOneSong(sid, api, signal) {
    try {
      let resp = await fetch(`${api}?server=netease&type=song&id=${sid}&level=lossless`, { signal });
      let data = await resp.json();
      let song = Array.isArray(data) ? data[0] : data;

      if (!song || !song.url) {
        resp = await fetch(`${api}?server=netease&type=song&id=${sid}`, { signal });
        data = await resp.json();
        song = Array.isArray(data) ? data[0] : data;
      }

      if (song && song.url) {
        return {
          name: song.title || "Unknown",
          artist: song.author || "Unknown",
          url: song.url,
          cover: song.pic || "",
          lrc: song.lrc || "",
        };
      }
    } catch (e) {
      // Aborted — caller checks signal.aborted
      if (e.name !== "AbortError") console.error(e);
    }
    return null;
  }

  async function fetchAllSongs(ids, signal) {
    for (const api of METING_APIS) {
      const results = await Promise.allSettled(
        ids.map((sid) => fetchOneSong(sid, api, signal))
      );

      if (signal.aborted) return [];

      const songs = [];
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          songs.push(r.value);
        }
      }

      if (songs.length > 0) return songs;
    }
    return [];
  }

  async function readIdsFromPlaylistFile(file, signal) {
    try {
      const resp = await fetch(`${baseUrl}playlists/${file}`, { signal });
      if (!resp.ok) return [];
      const text = await resp.text();
      return text.split("\n").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
    } catch {
      return [];
    }
  }

  // ----- Fallback -----

  async function fallbackLoad(signal) {
    if (!apInstance) return;

    try {
      const resp = await fetch(`${baseUrl}playlist.txt`, { signal });
      if (resp.ok) {
        const text = await resp.text();
        const ids = text.split("\n").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
        if (ids.length > 0) {
          const songs = await fetchAllSongs(ids, signal);
          if (signal.aborted) return;
          if (songs.length > 0) {
            playlistSongs = songs;
            apInstance.list.clear();
            apInstance.list.add(songs);
            renderPlaylist();
            updateUI();
            return;
          }
        }
      }
    } catch (e) {
      if (e.name === "AbortError") return;
    }

    if (signal.aborted) return;

    try {
      const resp = await fetch(`${baseUrl}playlist.json`, { signal });
      const songs = await resp.json();
      if (songs && songs.length > 0) {
        playlistSongs = songs;
        apInstance.list.clear();
        apInstance.list.add(songs);
        renderPlaylist();
        updateUI();
        return;
      }
    } catch (e) {
      if (e.name === "AbortError") return;
    }

    if (!signal.aborted) showEmpty("暂无可用歌单");
  }

  // ----- UI -----

  function renderPlaylist() {
    playlistEl.innerHTML = "";
    playlistCount.textContent = `${playlistSongs.length} 首`;
    playlistSongs.forEach((song, idx) => {
      const div = document.createElement("div");
      div.className = "mp-playlist-item";
      div.dataset.apIdx = idx;
      div.innerHTML = `<span class="mp-pl-num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="mp-pl-playing-icon"><i class="fa fa-music"></i></span>
        <div class="mp-pl-info">
          <div class="mp-pl-name"></div>
          <div class="mp-pl-artist"></div>
        </div>`;
      div.querySelector(".mp-pl-name").textContent = song.name;
      div.querySelector(".mp-pl-artist").textContent = song.artist;
      div.addEventListener("click", () => {
        if (!apInstance) return;
        const i = parseInt(div.dataset.apIdx);
        if (!isNaN(i) && i < apInstance.list.audios.length) {
          apInstance.list.switch(i);
          apInstance.play();
        }
      });
      playlistEl.appendChild(div);
    });
    updatePlaylistActive();
  }

  function showEmpty(msg) {
    playlistEl.innerHTML = `<div class="mp-empty">${msg}</div>`;
    playlistCount.textContent = "0 首";
  }

  function showSpinner() {
    playlistEl.innerHTML = '<div class="mp-spinner"><i class="fa fa-spinner fa-pulse fa-2x"></i></div>';
    playlistCount.textContent = "加载中...";
  }

  function updatePlaylistActive() {
    if (!apInstance || !playlistEl) return;
    const curIdx = apInstance.list.index;
    playlistEl.querySelectorAll(".mp-playlist-item").forEach((el) => {
      const apIdx = parseInt(el.dataset.apIdx);
      el.classList.toggle("active", apIdx === curIdx);
    });
    const active = playlistEl.querySelector(".mp-playlist-item.active");
    if (active) active.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function updateUI() {
    if (!apInstance) return;
    const cur = apInstance.list.audios[apInstance.list.index];
    if (!cur) return;
    titleEl.textContent = cur.name || "Unknown";
    artistEl.textContent = cur.artist || "Unknown";
    const cover = cur.cover || "";
    if (cover) {
      coverEl.src = cover;
      bgEl.style.backgroundImage = `url(${cover})`;
    }
    requestAnimationFrame(updateProgress);
    const cls = apInstance.paused ? "fa fa-play" : "fa fa-pause";
    const barIcon = document.querySelector("#mp-btn-play i");
    if (barIcon) barIcon.className = cls;
  }

  function updateProgress() {
    if (!apInstance) return;
    const audio = apInstance.audio;
    if (!audio || !audio.duration) {
      progressFill.style.width = "0%";
      currentTimeEl.textContent = "00:00";
      durationEl.textContent = "00:00";
      rafId = requestAnimationFrame(updateProgress);
      return;
    }
    progressFill.style.width = ((audio.currentTime / audio.duration) * 100) + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
    if (!apInstance.paused) rafId = requestAnimationFrame(updateProgress);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // ----- Controls -----

  progressBar.addEventListener("click", (e) => {
    if (!apInstance) return;
    const audio = apInstance.audio;
    if (!audio || !audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    updateProgress();
  });

  document.getElementById("mp-btn-prev")?.addEventListener("click", () => {
    if (apInstance) apInstance.skipBack();
  });
  document.getElementById("mp-btn-play")?.addEventListener("click", () => {
    if (apInstance) apInstance.toggle();
  });
  document.getElementById("mp-btn-next")?.addEventListener("click", () => {
    if (apInstance) apInstance.skipForward();
  });

  // Volume bar — draggable
  const volBar = document.getElementById("mp-bar-volume");
  const volFill = document.getElementById("mp-bar-volume-fill");
  const volLabel = document.getElementById("mp-vol-label");
  let volDragging = false;

  if (volBar && volFill) {
    function setVolFromEvent(e) {
      if (!apInstance) return;
      const rect = volBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      volFill.style.width = (Math.round(ratio * 100)) + "%";
      if (volLabel) volLabel.textContent = Math.round(ratio * 100);
      apInstance.volume(ratio, true);
    }
    volBar.addEventListener("mousedown", (e) => {
      e.preventDefault();
      volDragging = true;
      setVolFromEvent(e);
    });
    document.addEventListener("mousemove", (e) => {
      if (!volDragging) return;
      setVolFromEvent(e);
    });
    document.addEventListener("mouseup", () => { volDragging = false; });
    setTimeout(() => {
      if (apInstance) {
        const v = Math.round(apInstance.volume() * 100);
        volFill.style.width = v + "%";
        if (volLabel) volLabel.textContent = v;
      }
    }, 500);
  }

  // Play mode toggle
  const modeBtn = document.getElementById("mp-btn-mode");
  if (modeBtn) {
    const modes = ["list", "random", "single"];
    const modeIcons = ["fa-retweet", "fa-random", "fa-redo"];
    let modeIdx = 0;
    function updateModeUI() {
      modeBtn.querySelector("i").className = `fa ${modeIcons[modeIdx]}`;
    }
    modeBtn.addEventListener("click", () => {
      modeIdx = (modeIdx + 1) % modes.length;
      if (apInstance) apInstance.mode = modes[modeIdx];
      updateModeUI();
    });
    updateModeUI();
  }

  // Keyboard shortcuts
  keydownHandler = (e) => {
    if (!apInstance) return;
    if (e.ctrlKey && e.code === "ArrowLeft") { e.preventDefault(); apInstance.skipBack(); }
    if (e.ctrlKey && e.code === "ArrowRight") { e.preventDefault(); apInstance.skipForward(); }
    if (e.ctrlKey && e.code === "Space") { e.preventDefault(); apInstance.toggle(); }
  };
  document.addEventListener("keydown", keydownHandler);

  init().catch((err) => console.error("Music player init failed:", err));
}

export function destroyMusicPlayer() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (keydownHandler) { document.removeEventListener("keydown", keydownHandler); keydownHandler = null; }
  if (apInstance) { apInstance.destroy(); apInstance = null; }
  playlistSongs = [];
}
