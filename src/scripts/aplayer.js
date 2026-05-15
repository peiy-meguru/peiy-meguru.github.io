// Music widget — edge-stuck square with slide-out controls

let apInstance = null;
let isOpen = false;
let playlistSongs = [];
let upcomingVisible = false;

export function initAPlayer() {
  const container = document.getElementById("aplayer-instance");
  const widget = document.getElementById("music-widget");
  const toggle = document.getElementById("music-widget-toggle");
  const coverImg = document.getElementById("music-widget-cover");
  const titleEl = document.getElementById("music-widget-title");
  const artistEl = document.getElementById("music-widget-artist");
  const upcomingEl = document.getElementById("music-widget-upcoming");
  const upcomingBtn = document.getElementById("music-btn-upcoming");

  if (!container || !widget || !toggle) return;

  const server = container.dataset.server || "netease";
  const id = container.dataset.id || "60198";
  const theme = container.dataset.theme || "#E67474";

  async function createAPlayer() {
    try {
      const { default: APlayer } = await import("aplayer");

      apInstance = new APlayer({
        container: container,
        mini: false,
        fixed: false,
        theme: theme,
        autoplay: false,
        mutex: true,
        lrcType: 0,
        listFolded: true,
        preload: "auto",
        loop: "all",
        order: "list",
        storageName: "sakura-aplayer",
        audio: [],
      });

      await fetchPlaylist(id, server, apInstance);

      apInstance.on("play", updateNowPlaying);
      apInstance.on("pause", updateNowPlaying);
      apInstance.on("listswitch", () => {
        updateNowPlaying();
        updateUpcoming();
      });
      apInstance.on("ended", updateNowPlaying);
    } catch (e) {
      console.warn("APlayer init failed:", e);
    }
  }

  async function fetchPlaylist(playlistId, serverType, ap) {
    const baseUrl = (window.SAKURA_BASE || "/").replace(/\/?$/, "/");

    const txtIds = await readPlaylistIds(baseUrl);
    if (txtIds.length > 0) {
      renderUpcomingShells(txtIds.length);
      const songs = await resolveIdsFromMeting(txtIds);
      if (songs.length > 0) {
        playlistSongs = songs;
        ap.list.add(songs);
        updateNowPlaying();
        updateUpcoming();
        return;
      }
    }

    const metingSongs = await resolveFromMetingPlaylist(serverType, playlistId);
    if (metingSongs.length > 0) {
      playlistSongs = metingSongs;
      ap.list.add(metingSongs);
      updateNowPlaying();
      updateUpcoming();
      return;
    }

    const jsonSongs = await resolveFromJson(baseUrl);
    if (jsonSongs.length > 0) {
      playlistSongs = jsonSongs;
      ap.list.add(jsonSongs);
      updateNowPlaying();
      updateUpcoming();
      return;
    }

    console.warn("No playlist sources available");
  }

  async function readPlaylistIds(baseUrl) {
    try {
      const resp = await fetch(`${baseUrl}playlist.txt`);
      if (!resp.ok) return [];
      const text = await resp.text();
      return text.split("\n").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
    } catch {
      return [];
    }
  }

  async function resolveIdsFromMeting(ids) {
    const apis = [
      "https://api.i-meto.com/meting/api",
      "https://meting.qjqq.cn/api",
    ];

    for (const api of apis) {
      try {
        const songs = [];
        for (const sid of ids) {
          try {
            let songResp = await fetch(
              `${api}?server=netease&type=song&id=${sid}&level=lossless`
            );
            let data = await songResp.json();
            let song = Array.isArray(data) ? data[0] : data;

            if (!song || !song.url) {
              songResp = await fetch(
                `${api}?server=netease&type=song&id=${sid}`
              );
              data = await songResp.json();
              song = Array.isArray(data) ? data[0] : data;
            }

            if (song && song.url) {
              songs.push({
                name: song.title || "Unknown",
                artist: song.author || "Unknown",
                url: song.url,
                cover: song.pic || "",
                lrc: song.lrc || "",
              });
            }
          } catch {
            continue;
          }
        }

        if (songs.length > 0) return songs;
      } catch {
        continue;
      }
    }
    return [];
  }

  async function resolveFromMetingPlaylist(serverType, playlistId) {
    const apis = [
      `https://api.i-meto.com/meting/api?server=${serverType}&type=playlist&id=${playlistId}`,
      `https://meting.qjqq.cn/api?server=${serverType}&type=playlist&id=${playlistId}`,
    ];

    for (const api of apis) {
      try {
        const resp = await fetch(api);
        const songs = await resp.json();
        if (songs && songs.length > 0) {
          return songs.map((song) => ({
            name: song.title || song.name || "Unknown",
            artist: song.author || song.artist || "Unknown",
            url: song.url || "",
            cover: song.pic || song.cover || "",
            lrc: "",
          }));
        }
      } catch {
        continue;
      }
    }
    return [];
  }

  async function resolveFromJson(baseUrl) {
    try {
      const resp = await fetch(`${baseUrl}playlist.json`);
      const songs = await resp.json();
      return songs && songs.length > 0 ? songs : [];
    } catch {
      return [];
    }
  }

  function renderUpcomingShells(count) {
    if (!upcomingEl) return;

    titleEl.textContent = "Loading...";
    artistEl.textContent = "\u2014";

    if (count <= 1) {
      if (upcomingBtn) upcomingBtn.style.display = "none";
      upcomingEl.innerHTML = "";
      return;
    }

    if (upcomingBtn) upcomingBtn.style.display = "";
    upcomingEl.innerHTML = "";

    const showCount = Math.min(count - 1, 3);
    for (let i = 0; i < showCount; i++) {
      const div = document.createElement("div");
      div.className = "music-widget-upcoming-item skeleton";
      div.innerHTML = `
        <span class="up-index">${String(i + 1).padStart(2, "0")}</span>
        <div class="up-info">
          <div class="up-name"><span class="skel-bar" style="width:80%"></span></div>
          <div class="up-artist"><span class="skel-bar" style="width:50%"></span></div>
        </div>`;
      upcomingEl.appendChild(div);
    }
  }

  function getNextThreeSongs() {
    if (playlistSongs.length === 0) return [];
    const total = playlistSongs.length;
    const curIdx = apInstance ? apInstance.list.index : 0;
    const result = [];
    for (let i = 1; i <= 3; i++) {
      const idx = (curIdx + i) % total;
      if (idx === curIdx && i >= total) break;
      result.push({ ...playlistSongs[idx], realIdx: idx });
    }
    return result;
  }

  function updateUpcoming() {
    if (!upcomingEl) return;

    const nextSongs = getNextThreeSongs();
    upcomingEl.innerHTML = "";

    if (playlistSongs.length <= 1 || nextSongs.length === 0) {
      if (upcomingBtn) upcomingBtn.style.display = "none";
      return;
    }

    if (upcomingBtn) upcomingBtn.style.display = "";

    nextSongs.forEach((song) => {
      const div = document.createElement("div");
      div.className = "music-widget-upcoming-item";
      const songIdx = song.realIdx + 1;
      div.innerHTML = `
        <span class="up-index">${String(songIdx).padStart(2, "0")}</span>
        <div class="up-info">
          <div class="up-name">${song.name}</div>
          <div class="up-artist">${song.artist}</div>
        </div>`;
      div.addEventListener("click", () => {
        if (apInstance) {
          apInstance.list.switch(song.realIdx);
          apInstance.play();
        }
      });
      upcomingEl.appendChild(div);
    });
  }

  function showUpcoming() {
    if (!upcomingEl || !upcomingBtn) return;
    upcomingVisible = true;
    upcomingBtn.classList.add("active");
    upcomingEl.classList.add("show");

    const items = upcomingEl.querySelectorAll(".music-widget-upcoming-item");
    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.add("pop-in");
      }, i * 100 + 50);
    });
  }

  function hideUpcoming() {
    if (!upcomingEl || !upcomingBtn) return;
    upcomingVisible = false;
    upcomingBtn.classList.remove("active");
    upcomingEl.classList.remove("show");

    const items = upcomingEl.querySelectorAll(".music-widget-upcoming-item");
    items.forEach((item) => {
      item.classList.remove("pop-in");
    });
  }

  upcomingBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (upcomingVisible) {
      hideUpcoming();
    } else {
      showUpcoming();
    }
  });

  function updateNowPlaying() {
    if (!apInstance) return;
    const cur = apInstance.list.audios[apInstance.list.index];
    if (!cur) return;

    const cover = cur.cover || "";
    titleEl.textContent = cur.name || "Unknown";
    artistEl.textContent = cur.artist || "Unknown";
    if (cover) {
      coverImg.style.backgroundImage = `url(${cover})`;
    }

    const playBtn = document.getElementById("music-btn-play");
    if (playBtn && playBtn.querySelector("i")) {
      playBtn.querySelector("i").className =
        apInstance.paused ? "fa fa-play" : "fa fa-pause";
    }
  }

  function openWidget() {
    isOpen = true;
    widget.classList.add("open");
    updateNowPlaying();
  }

  function closeWidget() {
    isOpen = false;
    widget.classList.remove("open");
    hideUpcoming();
  }

  function toggleWidget() {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleWidget();
  });

  document.addEventListener("click", (e) => {
    if (isOpen && !widget.contains(e.target)) {
      closeWidget();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeWidget();
  });

  document.getElementById("music-btn-play")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (apInstance) apInstance.toggle();
  });

  document.getElementById("music-btn-prev")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (apInstance) apInstance.skipBack();
  });

  document.getElementById("music-btn-next")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (apInstance) apInstance.skipForward();
  });

  // Volume bar
  const volumeBar = document.getElementById("music-widget-volume");
  const volumeFill = document.getElementById("music-widget-volume-fill");
  if (volumeBar && volumeFill) {
    function setVolumeUI(v) {
      volumeFill.style.width = (v * 100) + "%";
    }

    volumeBar.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!apInstance) return;
      const rect = volumeBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const vol = Math.max(0, Math.min(1, ratio));
      apInstance.volume(vol, true);
      setVolumeUI(vol);
    });

    const origUpdateNowPlaying = updateNowPlaying;
    updateNowPlaying = function() {
      origUpdateNowPlaying();
      if (apInstance && volumeFill) {
        const vol = apInstance.volume();
        setVolumeUI(vol);
      }
    };
  }

  if (document.body.clientWidth > 640) {
    createAPlayer();
  }
}

export function destroyAPlayer() {
  if (apInstance) {
    apInstance.destroy();
    apInstance = null;
  }
}
