# Playlist Loading Rewrite — AbortController + Parallel Fetch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the token-based sequential song resolution with AbortController-backed parallel fetches. When a new playlist load starts, old in-flight requests are truly cancelled (not just ignored). All songs render at once — no incremental DOM updates during load.

**Architecture:** Each `loadPlaylistFile()` call spins up a fresh `AbortController`. `readIdsFromPlaylistFile()` and `fetchAllSongs()` both accept `signal`. When a new load begins, `currentController.abort()` cancels all pending fetches from the prior load. `Promise.allSettled` parallelizes Meting API calls. Only the most recent load populates APlayer and DOM. No token checks, no DOM mutation during loading, no stale writes.

**Tech Stack:** Vanilla JS, APlayer, Meting API, no new dependencies

---

### Task 1: Replace loading state variables

**Files:**
- Modify: `src/scripts/music-player.js` (lines 7-8)

- [ ] **Step 1: Replace `loadToken` with `loadController`**

Remove the `loadToken` counter and add an `AbortController` reference:

```js
// Before (line 8):
let loadToken = 0;

// After:
let loadController = null;
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/music-player.js
git commit -m "refactor: replace loadToken with AbortController reference"
```

---

### Task 2: Rewrite `loadPlaylistFile` — clear, dispatch, abort

**Files:**
- Modify: `src/scripts/music-player.js` (lines 121–161, the entire `loadPlaylistFile` function)

- [ ] **Step 1: Replace `loadPlaylistFile` with abort-first + parallel fetch version**

Replace the entire function body:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/music-player.js
git commit -m "refactor: rewrite loadPlaylistFile with AbortController"
```

---

### Task 3: Add `showSpinner` and rewrite `readIdsFromPlaylistFile` with `signal`

**Files:**
- Modify: `src/scripts/music-player.js` (add `showSpinner`, rewrite `readIdsFromPlaylistFile` near lines 251–260)

- [ ] **Step 1: Add `showSpinner` helper**

Add after `showEmpty` (around line 340):

```js
function showSpinner() {
  playlistEl.innerHTML = '<div class="mp-spinner"><i class="fa fa-spinner fa-pulse fa-2x"></i></div>';
  playlistCount.textContent = "加载中...";
}
```

- [ ] **Step 2: Rewrite `readIdsFromPlaylistFile` to accept `signal`**

```js
async function readIdsFromPlaylistFile(file, signal) {
  try {
    const resp = await fetch(`${baseUrl}playlists/${file}`, { signal });
    if (!resp.ok) return [];
    const text = await resp.text();
    return text.split("\n").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  } catch (err) {
    if (err.name === "AbortError") throw err; // rethrow to let caller handle
    return [];
  }
}
```

- [ ] **Step 3: Add CSS for spinner**

Add to `src/styles/music-player.css` (at the end):

```css
.mp-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.3);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/scripts/music-player.js src/styles/music-player.css
git commit -m "feat: add showSpinner, signal-aware readIdsFromPlaylistFile"
```

---

### Task 4: Add `fetchAllSongs` — parallel Meting API with AbortSignal

**Files:**
- Modify: `src/scripts/music-player.js` (add `fetchAllSongs` function, remove old `resolveAndUpdateDOM`, `updateDOMSlot`, `renderPlaceholders`, `attachPlaylistHandlers`)

- [ ] **Step 1: Add `fetchAllSongs` function**

Add before the fallback section (around line 207, where `resolveAndUpdateDOM` currently is):

```js
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
    if (e.name === "AbortError") throw e;
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
```

- [ ] **Step 2: Remove old functions**

Remove: `resolveAndUpdateDOM`, `updateDOMSlot`, `renderPlaceholders`, `attachPlaylistHandlers`.

Also remove the `renderPlaylist` reference in `loadPlaylistFile` if still present — it's the existing `renderPlaylist` which stays.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/music-player.js
git commit -m "feat: add fetchAllSongs with parallel Promise.allSettled, remove old helpers"
```

---

### Task 5: Rewrite `fallbackLoad` to accept `signal` instead of `token`

**Files:**
- Modify: `src/scripts/music-player.js` (lines 264–305, `fallbackLoad`)

- [ ] **Step 1: Replace `fallbackLoad` signature and body**

```js
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
    if (e.name === "AbortError") throw e;
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
    if (e.name === "AbortError") throw e;
  }

  if (!signal.aborted) showEmpty("暂无可用歌单");
}
```

- [ ] **Step 2: Update `loadDefaultPlaylist` to pass `signal`**

Change at line 113–118:

```js
async function loadDefaultPlaylist() {
  loadController = new AbortController();
  const { signal } = loadController;
  if (currentPlaylistFile) {
    await loadPlaylistFile(currentPlaylistFile);
  } else {
    await fallbackLoad(signal);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/music-player.js
git commit -m "refactor: rewrite fallbackLoad with AbortSignal"
```

---

### Task 6: Verify `renderPlaylist` still works (click handlers unchanged)

**Files:**
- Modify: `src/scripts/music-player.js` (review lines 309–335, no changes needed)

- [ ] **Step 1: Verify `renderPlaylist` is intact**

The existing `renderPlaylist` (lines ~309–335) builds DOM from `playlistSongs` with `dataset.apIdx` and inline click listeners using `cloneNode` for clean binding. This function should remain unchanged since `fetchAllSongs` returns tracks in `ids` order.

Confirm no modifications are needed — the function uses `playlistSongs` which will be populated by the new `loadPlaylistFile`.

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: 11 pages built, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/music-player.js
git commit -m "chore: confirm renderPlaylist compatible with new fetchAllSongs"
```

---

### Task 7: Clean up — remove unused `showEmpty` if redundant, final build

**Files:**
- Modify: `src/scripts/music-player.js` (keep `showEmpty` — used by `fallbackLoad` and `loadDefaultPlaylist`)

- [ ] **Step 1: Verify no orphaned references**

Search for remaining references to removed functions:

```bash
grep -n "resolveAndUpdateDOM\|updateDOMSlot\|renderPlaceholders\|attachPlaylistHandlers\|loading\b" src/scripts/music-player.js
```

Expected: no matches (or only `renderPlaylist` which is the non-placeholder version).

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: 11 pages built, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/music-player.js
git commit -m "chore: clean up orphaned references, final build"
```
