// Client-side search using Fuse.js

export function initSearch() {
  const toggle = document.querySelector(".js-toggle-search");
  const searchForm = document.querySelector(".js-search");
  const searchInput = document.getElementById("search-input");
  const resultsBox = document.getElementById("PostlistBox");
  const closeBtn = document.querySelector(".search_close");

  if (!toggle || !searchForm || !searchInput || !resultsBox) return;

  let fuseInstance = null;
  let postsData = [];

  // Load search index - use window.SAKURA_BASE or default to '/'
  const baseUrl = (window.SAKURA_BASE || "/").replace(/\/?$/, "/");
  const indexPath = baseUrl + "search-index.json";

  fetch(indexPath)
    .then((res) => res.json())
    .then((data) => {
      postsData = data;
      // Dynamic import Fuse.js
      import("fuse.js").then(({ default: Fuse }) => {
        fuseInstance = new Fuse(postsData, {
          keys: ["title", "description", "content", "category"],
          threshold: 0.3,
          includeMatches: true,
          minMatchCharLength: 1,
        });
      });
    })
    .catch(() => {
      console.warn(
        "Search index not found. Create search-index.json in build step.",
      );
    });

  // Toggle search
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("is-active");
    searchForm.classList.toggle("is-visible");
    if (closeBtn) closeBtn.classList.toggle("is-visible");
    document.documentElement.style.overflowY = searchForm.classList.contains(
      "is-visible",
    )
      ? "hidden"
      : "unset";
    if (searchForm.classList.contains("is-visible")) {
      setTimeout(() => searchInput.focus(), 100);
    }
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener("click", closeSearch);
  }

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchForm.classList.contains("is-visible")) {
      closeSearch();
    }
  });

  // Search input
  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = searchInput.value.trim();
      if (!query || !fuseInstance) {
        resultsBox.innerHTML = "";
        return;
      }

      const results = fuseInstance.search(query).slice(0, 10);
      if (results.length === 0) {
        resultsBox.innerHTML =
          '<div class="ins-search-item"><header>No results found</header></div>';
        return;
      }

      resultsBox.innerHTML = results
        .map((r) => {
          const item = r.item;
          const title = highlightMatch(item.title, query);
          const preview =
            item.description || item.content?.substring(0, 100) || "";

          return `
          <a class="ins-selectable ins-search-item" href="${baseUrl}posts/${item.id}">
            <header>
              <i class="fa fa-file-o"></i> ${title}
            </header>
            <p class="ins-search-preview">${preview}</p>
          </a>
        `;
        })
        .join("");

      // Make result items clickable
      resultsBox.querySelectorAll(".ins-selectable").forEach((item) => {
        item.addEventListener("click", closeSearch);
      });
    }, 200);
  });

  // Enter to go to first result
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const firstResult = resultsBox.querySelector(".ins-selectable");
      if (firstResult && firstResult.tagName === "A") {
        window.location.href = firstResult.href;
      }
    }
  });

  function closeSearch() {
    toggle.classList.remove("is-active");
    searchForm.classList.remove("is-visible");
    if (closeBtn) closeBtn.classList.remove("is-visible");
    document.documentElement.style.overflowY = "unset";
    searchInput.value = "";
    resultsBox.innerHTML = "";
  }

  function highlightMatch(text, query) {
    const words = query.trim().split(/\s+/);
    let result = text;
    words.forEach((word) => {
      const regex = new RegExp(`(${escapeRegex(word)})`, "gi");
      result = result.replace(regex, '<mark class="search-keyword">$1</mark>');
    });
    return result;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
