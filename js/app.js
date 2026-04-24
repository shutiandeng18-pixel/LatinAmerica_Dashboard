document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initTheme();
  initSearch();
  initTabs();
  initPanel();
});

function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("la-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("la-theme", next);
    updateMapTheme();
    disposeCharts();
    if (activeIso) renderAllTabs(activeIso);
  });
}

function initSearch() {
  const input = document.getElementById("countrySearch");
  const results = document.getElementById("searchResults");
  const countries = Object.entries(countryMeta).map(([iso, m]) => ({ iso, ...m }));

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.classList.remove("active");
      resetMapHighlight();
      return;
    }
    const filtered = countries.filter(c =>
      c.name.includes(q) || c.nameEn.toLowerCase().includes(q)
    );
    results.innerHTML = filtered.map(c => `
      <div class="search-item" data-iso="${c.iso}">
        <img src="${c.flag}" alt="">
        <span>${c.name} <small style="color:var(--text-2)">${c.nameEn}</small></span>
      </div>
    `).join("");
    results.classList.add("active");
    if (filtered.length === 1) {
      highlightCountryOnMap(filtered[0].iso);
    }
  });

  results.addEventListener("click", e => {
    const item = e.target.closest(".search-item");
    if (!item) return;
    const iso = item.dataset.iso;
    selectCountry(iso);
    input.value = "";
    results.classList.remove("active");
    resetMapHighlight();
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!results.matches(":hover")) {
        results.classList.remove("active");
        resetMapHighlight();
      }
    }, 200);
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".search-box")) {
      results.classList.remove("active");
      resetMapHighlight();
    }
  });
}

function initTabs() {
  const tabs = document.getElementById("panelTabs");
  tabs.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    const tab = e.target.dataset.tab;
    tabs.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".tab-content").forEach(c => {
      const isActive = c.id === "tab-" + tab;
      c.classList.toggle("active", isActive);
    });
    setTimeout(() => {
      Object.values(chartInstances).forEach(c => c && c.resize());
    }, 60);
  });
}

function initPanel() {
  document.getElementById("panelClose").addEventListener("click", () => {
    closePanel();
    resetZoom();
  });
}

window.addEventListener("resize", () => {
  handleResize();
  Object.values(chartInstances).forEach(c => c && c.resize());
});
