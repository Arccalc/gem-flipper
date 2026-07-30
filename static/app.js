(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    statusPill: $("statusPill"),
    statusText: $("statusText"),
    countdown: $("countdown"),
    refreshBtn: $("refreshBtn"),
    minListings: $("minListings"),
    minProfit: $("minProfit"),
    minRoi: $("minRoi"),
    search: $("search"),
    gemsBody: $("gemsBody"),
    gemsTable: $("gemsTable"),
    statCount: $("statCount"),
    statTopProfit: $("statTopProfit"),
    statLeague: $("statLeague"),
    statAge: $("statAge"),
    subtitle: $("subtitle"),
    thSell: $("thSell"),
    thSellListings: $("thSellListings"),
    modeNormal: $("modeNormal"),
    modeCorrupt: $("modeCorrupt"),
  };

  /** @type {any[]} */
  let allFlips = [];
  let nextRefreshIn = null;
  let debounceTimer = null;
  let sortKey = "profit";
  let sortOrder = "desc";
  /** @type {"normal" | "corrupt"} */
  let mode = "normal";

  function isCorruptMode() {
    return mode === "corrupt";
  }

  function updateModeChrome() {
    const corrupt = isCorruptMode();
    document.body.classList.toggle("mode-corrupt", corrupt);
    if (els.modeNormal) els.modeNormal.classList.toggle("active", !corrupt);
    if (els.modeCorrupt) els.modeCorrupt.classList.toggle("active", corrupt);
    if (els.subtitle) {
      els.subtitle.textContent = corrupt
        ? "L1 → max corrupted (+1) · quality 0 · Allflame"
        : "L1 → max level · quality 0 · uncorrupted · Allflame";
    }
    if (els.thSell) {
      els.thSell.innerHTML = corrupt
        ? `Max c продать <span class="sort-ind" data-ind="sell"></span>`
        : `Max продать <span class="sort-ind" data-ind="sell"></span>`;
    }
    if (els.thSellListings) {
      els.thSellListings.innerHTML = corrupt
        ? `Листинги Max c <span class="sort-ind" data-ind="sell_listings"></span>`
        : `Листинги Max <span class="sort-ind" data-ind="sell_listings"></span>`;
    }
    updateSortIndicators();
  }

  function setMode(next) {
    if (next !== "normal" && next !== "corrupt") return;
    if (mode === next) return;
    mode = next;
    updateModeChrome();
    // Clear table immediately so mode switch is obvious while loading
    if (els.gemsBody) {
      els.gemsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="9">Загружаем ${
            next === "corrupt" ? "corrupt" : "normal"
          } флипы…</td>
        </tr>`;
    }
    loadFlips();
  }

  function formatChaos(n) {
    if (n == null || Number.isNaN(n)) return "—";
    if (Math.abs(n) >= 100) return Math.round(n).toLocaleString("en-US");
    if (Math.abs(n) >= 10) return n.toFixed(1);
    return n.toFixed(2);
  }

  function formatDivine(n) {
    if (n == null || Math.abs(n) < 0.01) return null;
    if (Math.abs(n) >= 10) return n.toFixed(1);
    return n.toFixed(2);
  }

  function formatAge(seconds) {
    if (seconds == null) return "—";
    const s = Math.max(0, Math.floor(seconds));
    if (s < 60) return `${s}с назад`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}м назад`;
    const h = Math.floor(m / 60);
    return `${h}ч ${m % 60}м`;
  }

  function formatCountdown(seconds) {
    if (seconds == null) return "—:—";
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function setStatus(kind, text) {
    els.statusPill.classList.remove("ok", "err", "loading");
    if (kind) els.statusPill.classList.add(kind);
    els.statusText.textContent = text;
  }

  function sortValue(f, key) {
    switch (key) {
      case "name":
        return f.name.toLowerCase();
      case "buy":
        return f.buy_chaos;
      case "sell":
        return f.sell_chaos;
      case "profit":
        return f.profit_chaos;
      case "roi":
        return f.roi_percent;
      case "buy_listings":
        return f.buy_listings;
      case "sell_listings":
        return f.sell_listings;
      default:
        return f.profit_chaos;
    }
  }

  function applyView() {
    const minListings = Number(els.minListings.value) || 0;
    const minProfit = Number(els.minProfit.value) || 0;
    const minRoi = Number(els.minRoi.value) || 0;
    const q = (els.search.value || "").trim().toLowerCase();

    let rows = allFlips.filter((item) => {
      if (item.buy_listings < minListings || item.sell_listings < minListings) return false;
      if (item.profit_chaos < minProfit) return false;
      if (item.roi_percent < minRoi) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });

    const mult = sortOrder === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv) * mult;
      }
      if (av === bv) return b.profit_chaos - a.profit_chaos;
      return av > bv ? mult : -mult;
    });

    renderRows(rows, minListings);
    updateSortIndicators();
  }

  function listingsClass(n, min) {
    if (n < min) return "listings low";
    if (n >= min * 2) return "listings good";
    return "listings";
  }

  function renderRows(flips, minListings) {
    if (!flips.length) {
      els.gemsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="9">Нет вариантов под текущие фильтры. Попробуй снизить мин. листинги или профит.</td>
        </tr>`;
      els.statCount.textContent = "0";
      els.statTopProfit.textContent = "—";
      return;
    }

    els.statCount.textContent = String(flips.length);
    els.statTopProfit.textContent = `+${formatChaos(flips[0].profit_chaos)}c`;

    const html = flips
      .map((f, i) => {
        const top = i < 3 ? "top-row" : "";
        const divProfit = formatDivine(f.profit_divine);
        const buyDiv = formatDivine(f.buy_divine);
        const sellDiv = formatDivine(f.sell_divine);
        const icon = f.icon
          ? `<img class="gem-icon" src="${f.icon}" alt="" loading="lazy" width="36" height="36" />`
          : `<div class="gem-icon"></div>`;

        const links = [];
        if (f.trade_buy_url) {
          links.push(`<a class="link-btn" href="${f.trade_buy_url}" target="_blank" rel="noopener">Buy L1</a>`);
        }
        if (f.trade_sell_url) {
          const sellLabel = isCorruptMode() ? `Sell L${f.max_level}c` : `Sell L${f.max_level}`;
          links.push(`<a class="link-btn" href="${f.trade_sell_url}" target="_blank" rel="noopener">${sellLabel}</a>`);
        }
        if (f.ninja_url) {
          links.push(`<a class="link-btn" href="${f.ninja_url}" target="_blank" rel="noopener">ninja</a>`);
        }

        const meta = isCorruptMode()
          ? `L1 → L${f.max_level}c · q0 · corrupted`
          : `L1 → L${f.max_level} · q0 · uncorrupted`;

        return `
          <tr class="${top}">
            <td class="col-rank">${i + 1}</td>
            <td>
              <div class="gem-cell">
                ${icon}
                <div>
                  <div class="gem-name">${escapeHtml(f.name)}</div>
                  <div class="gem-meta">${meta}</div>
                </div>
              </div>
            </td>
            <td class="num">
              <div class="price buy">${formatChaos(f.buy_chaos)}c</div>
              ${buyDiv ? `<div class="profit-div">${buyDiv}d</div>` : ""}
            </td>
            <td class="num">
              <div class="price sell">${formatChaos(f.sell_chaos)}c</div>
              ${sellDiv ? `<div class="profit-div">${sellDiv}d</div>` : ""}
            </td>
            <td class="num">
              <div class="profit-cell">
                <span class="profit">+${formatChaos(f.profit_chaos)}c</span>
                ${divProfit ? `<span class="profit-div">+${divProfit}d</span>` : ""}
              </div>
            </td>
            <td class="num"><span class="roi">${formatChaos(f.roi_percent)}%</span></td>
            <td class="num"><span class="${listingsClass(f.buy_listings, minListings)}">${f.buy_listings}</span></td>
            <td class="num"><span class="${listingsClass(f.sell_listings, minListings)}">${f.sell_listings}</span></td>
            <td class="col-links"><div class="links">${links.join("")}</div></td>
          </tr>`;
      })
      .join("");

    els.gemsBody.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateSortIndicators() {
    document.querySelectorAll(".sort-ind").forEach((el) => {
      const key = el.getAttribute("data-ind");
      if (key === sortKey) {
        el.textContent = sortOrder === "asc" ? "▲" : "▼";
        el.classList.add("active");
      } else {
        el.textContent = "";
        el.classList.remove("active");
      }
    });
    document.querySelectorAll("th.sortable").forEach((th) => {
      th.classList.toggle("sorted", th.getAttribute("data-sort") === sortKey);
    });
  }

  async function loadFlips({ silent = false } = {}) {
    if (!silent) setStatus("loading", "обновление…");
    try {
      const res = await fetch(
        `/api/flips?min_listings=0&limit=5000&sort=profit&order=desc&mode=${encodeURIComponent(mode)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) {
        setStatus("err", `ошибка: ${data.error}`);
      } else if (data.fetching && !(data.flips || []).length) {
        setStatus("loading", "качаем poe.ninja…");
      } else {
        setStatus("ok", "актуально");
      }

      allFlips = data.flips || [];
      nextRefreshIn = data.next_refresh_in;
      els.statLeague.textContent = data.league || "—";
      els.statAge.textContent = formatAge(data.age_seconds);
      applyView();
      updateCountdown();
    } catch (err) {
      setStatus("err", String(err.message || err));
      els.gemsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="9">Не удалось загрузить данные: ${escapeHtml(err.message || err)}</td>
        </tr>`;
    }
  }

  async function forceRefresh() {
    els.refreshBtn.disabled = true;
    setStatus("loading", "ручное обновление…");
    try {
      await fetch("/api/refresh", { method: "POST" });
      await loadFlips();
    } catch (err) {
      setStatus("err", String(err.message || err));
    } finally {
      els.refreshBtn.disabled = false;
    }
  }

  function updateCountdown() {
    if (nextRefreshIn == null) {
      els.countdown.textContent = "—:—";
      return;
    }
    els.countdown.textContent = formatCountdown(nextRefreshIn);
  }

  function scheduleView() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyView, 150);
  }

  ["minListings", "minProfit", "minRoi"].forEach((id) => {
    $(id).addEventListener("change", scheduleView);
    $(id).addEventListener("input", scheduleView);
  });
  els.search.addEventListener("input", scheduleView);
  els.refreshBtn.addEventListener("click", forceRefresh);
  if (els.modeNormal) els.modeNormal.addEventListener("click", () => setMode("normal"));
  if (els.modeCorrupt) els.modeCorrupt.addEventListener("click", () => setMode("corrupt"));
  // Event delegation fallback (works even if button refs were stale)
  document.querySelector(".mode-toggle")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-mode]");
    if (!btn) return;
    setMode(btn.getAttribute("data-mode"));
  });

  els.gemsTable.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (!key) return;
      if (sortKey === key) {
        sortOrder = sortOrder === "desc" ? "asc" : "desc";
      } else {
        sortKey = key;
        sortOrder = key === "name" ? "asc" : "desc";
      }
      applyView();
    });
  });

  setInterval(() => loadFlips({ silent: true }), 30_000);

  setInterval(() => {
    if (nextRefreshIn != null) {
      nextRefreshIn = Math.max(0, nextRefreshIn - 1);
      updateCountdown();
      if (nextRefreshIn <= 0) {
        loadFlips({ silent: true });
      }
    }
  }, 1000);

  updateModeChrome();
  loadFlips();
})();
