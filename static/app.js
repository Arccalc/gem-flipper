(() => {
  const $ = (id) => document.getElementById(id);

  const I18N = {
    en: {
      langAria: "Language",
      modeAria: "Flip mode",
      modeNormal: "Normal",
      modeCorrupt: "Corrupt",
      modeCorruptTitle: "L1 q0 uncorrupted → L21 q0 corrupted",
      statusLoading: "loading…",
      statusUpdating: "updating…",
      statusFetching: "fetching poe.ninja…",
      statusOk: "up to date",
      statusError: "error: {error}",
      statusManual: "manual refresh…",
      countdownTitle: "Until auto-refresh",
      countdownLabel: "refresh",
      refreshBtn: "↻ Refresh",
      refreshTitle: "Refresh now",
      labelMinListings: "Min listings (both sides)",
      hintMinListings: "higher = more reliable price",
      labelMinProfit: "Min profit (chaos)",
      labelMinRoi: "Min ROI %",
      labelSearch: "Search gem",
      searchPlaceholder: "e.g. Bladefall, Enlighten…",
      statCount: "options",
      statTopProfit: "top profit",
      statLeague: "league",
      statAge: "data age",
      thName: "Gem",
      thBuy: "L1 buy",
      thSell: "Max sell",
      thSellCorrupt: "Max c sell",
      thProfit: "Profit",
      thBuyListings: "L1 listings",
      thSellListings: "Max listings",
      thSellListingsCorrupt: "Max c listings",
      thLinks: "Links",
      emptyLoading: "Loading data from poe.ninja…",
      emptyLoadingMode: "Loading {mode} flips…",
      emptyNone:
        "No options match the current filters. Try lowering min listings or profit.",
      emptyError: "Failed to load data: {error}",
      subtitleNormal: "L1 → max level · quality 0 · uncorrupted · Allflame",
      subtitleCorrupt: "L1 → max corrupted (+1) · quality 0 · Allflame",
      footerData:
        'Data: <a href="https://poe.ninja/poe1/economy/allflame/skill-gems?level=1&quality=0-19&corrupted=No" target="_blank" rel="noopener">poe.ninja Skill Gems</a> · auto-refresh every {minutes} min · quality 0 (0–19)',
      footerHint:
        "Normal: profit = max uncorrupted price − L1. Corrupt: profit = L21 corrupted price − L1. Click a header to sort.",
      ageSeconds: "{n}s ago",
      ageMinutes: "{n}m ago",
      ageHours: "{h}h {m}m",
      metaNormal: "L1 → L{level} · q0 · uncorrupted",
      metaCorrupt: "L1 → L{level}c · q0 · corrupted",
      buyL1: "Buy L1",
      sellMax: "Sell L{level}",
      sellMaxCorrupt: "Sell L{level}c",
      ninja: "ninja",
      kofiTitle: "Support on Ko-fi",
      kofiTip: "Support the developer",
    },
    ru: {
      langAria: "Язык",
      modeAria: "Режим флипов",
      modeNormal: "Normal",
      modeCorrupt: "Corrupt",
      modeCorruptTitle: "L1 q0 uncorrupted → L21 q0 corrupted",
      statusLoading: "загрузка…",
      statusUpdating: "обновление…",
      statusFetching: "качаем poe.ninja…",
      statusOk: "актуально",
      statusError: "ошибка: {error}",
      statusManual: "ручное обновление…",
      countdownTitle: "До авто-обновления",
      countdownLabel: "refresh",
      refreshBtn: "↻ Обновить",
      refreshTitle: "Обновить сейчас",
      labelMinListings: "Мин. листингов (с обеих сторон)",
      hintMinListings: "больше = достовернее цена",
      labelMinProfit: "Мин. профит (chaos)",
      labelMinRoi: "Мин. ROI %",
      labelSearch: "Поиск гема",
      searchPlaceholder: "например Bladefall, Enlighten…",
      statCount: "вариантов",
      statTopProfit: "топ профит",
      statLeague: "лига",
      statAge: "данные",
      thName: "Гем",
      thBuy: "L1 купить",
      thSell: "Max продать",
      thSellCorrupt: "Max c продать",
      thProfit: "Профит",
      thBuyListings: "Листинги L1",
      thSellListings: "Листинги Max",
      thSellListingsCorrupt: "Листинги Max c",
      thLinks: "Ссылки",
      emptyLoading: "Загружаем данные с poe.ninja…",
      emptyLoadingMode: "Загружаем {mode} флипы…",
      emptyNone:
        "Нет вариантов под текущие фильтры. Попробуй снизить мин. листинги или профит.",
      emptyError: "Не удалось загрузить данные: {error}",
      subtitleNormal: "L1 → max level · quality 0 · uncorrupted · Allflame",
      subtitleCorrupt: "L1 → max corrupted (+1) · quality 0 · Allflame",
      footerData:
        'Данные: <a href="https://poe.ninja/poe1/economy/allflame/skill-gems?level=1&quality=0-19&corrupted=No" target="_blank" rel="noopener">poe.ninja Skill Gems</a> · авто-обновление каждые {minutes} мин · quality 0 (0–19)',
      footerHint:
        "Normal: профит = цена max uncorrupted − L1. Corrupt: профит = цена L21 corrupted − L1. Кликни заголовок — сортировка.",
      ageSeconds: "{n}с назад",
      ageMinutes: "{n}м назад",
      ageHours: "{h}ч {m}м",
      metaNormal: "L1 → L{level} · q0 · uncorrupted",
      metaCorrupt: "L1 → L{level}c · q0 · corrupted",
      buyL1: "Buy L1",
      sellMax: "Sell L{level}",
      sellMaxCorrupt: "Sell L{level}c",
      ninja: "ninja",
      kofiTitle: "Поддержать на Ko-fi",
      kofiTip: "Поддержать разработчика",
    },
  };

  const STORAGE_KEY = "gemflipper_lang";

  /** @type {"en" | "ru"} */
  let lang =
    localStorage.getItem(STORAGE_KEY) === "ru" ||
    localStorage.getItem(STORAGE_KEY) === "en"
      ? /** @type {"en" | "ru"} */ (localStorage.getItem(STORAGE_KEY))
      : "en";

  /**
   * @param {string} key
   * @param {Record<string, string | number>} [params]
   */
  function t(key, params) {
    const dict = I18N[lang] || I18N.en;
    let s = dict[key] ?? I18N.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  }

  const els = {
    statusPill: $("statusPill"),
    statusText: $("statusText"),
    countdown: $("countdown"),
    countdownWrap: $("countdownWrap"),
    countdownLabel: $("countdownLabel"),
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
    thSellText: $("thSellText"),
    thSellListingsText: $("thSellListingsText"),
    modeNormal: $("modeNormal"),
    modeCorrupt: $("modeCorrupt"),
    langEn: $("langEn"),
    langRu: $("langRu"),
    langToggle: $("langToggle"),
    modeToggle: $("modeToggle"),
    labelMinListings: $("labelMinListings"),
    hintMinListings: $("hintMinListings"),
    labelMinProfit: $("labelMinProfit"),
    labelMinRoi: $("labelMinRoi"),
    labelSearch: $("labelSearch"),
    statLabelCount: $("statLabelCount"),
    statLabelTopProfit: $("statLabelTopProfit"),
    statLabelLeague: $("statLabelLeague"),
    statLabelAge: $("statLabelAge"),
    thName: $("thName"),
    thBuy: $("thBuy"),
    thProfit: $("thProfit"),
    thBuyListings: $("thBuyListings"),
    thLinks: $("thLinks"),
    footerData: $("footerData"),
    footerHint: $("footerHint"),
    kofiBtn: $("kofiBtn"),
    kofiTip: $("kofiTip"),
  };

  /** @type {any[]} */
  let allFlips = [];
  let nextRefreshIn = null;
  let debounceTimer = null;
  let sortKey = "profit";
  let sortOrder = "desc";
  /** @type {"normal" | "corrupt"} */
  let mode = "normal";
  /** Last status for re-translate on language switch */
  let lastStatus = { kind: "loading", key: "statusLoading", params: null };

  function isCorruptMode() {
    return mode === "corrupt";
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;

    if (els.langToggle) els.langToggle.setAttribute("aria-label", t("langAria"));
    if (els.modeToggle) els.modeToggle.setAttribute("aria-label", t("modeAria"));
    if (els.langEn) els.langEn.classList.toggle("active", lang === "en");
    if (els.langRu) els.langRu.classList.toggle("active", lang === "ru");

    setText(els.modeNormal, t("modeNormal"));
    setText(els.modeCorrupt, t("modeCorrupt"));
    if (els.modeCorrupt) els.modeCorrupt.title = t("modeCorruptTitle");

    if (els.countdownWrap) els.countdownWrap.title = t("countdownTitle");
    setText(els.countdownLabel, t("countdownLabel"));
    if (els.refreshBtn) {
      els.refreshBtn.textContent = t("refreshBtn");
      els.refreshBtn.title = t("refreshTitle");
    }

    setText(els.labelMinListings, t("labelMinListings"));
    setText(els.hintMinListings, t("hintMinListings"));
    setText(els.labelMinProfit, t("labelMinProfit"));
    setText(els.labelMinRoi, t("labelMinRoi"));
    setText(els.labelSearch, t("labelSearch"));
    if (els.search) els.search.placeholder = t("searchPlaceholder");

    setText(els.statLabelCount, t("statCount"));
    setText(els.statLabelTopProfit, t("statTopProfit"));
    setText(els.statLabelLeague, t("statLeague"));
    setText(els.statLabelAge, t("statAge"));

    setText(els.thName, t("thName"));
    setText(els.thBuy, t("thBuy"));
    setText(els.thProfit, t("thProfit"));
    setText(els.thBuyListings, t("thBuyListings"));
    setText(els.thLinks, t("thLinks"));

    const minutes =
      (window.GEM_FLIPPER && window.GEM_FLIPPER.refreshMinutes) || 20;
    if (els.footerData) {
      els.footerData.innerHTML = t("footerData", { minutes });
    }
    setText(els.footerHint, t("footerHint"));

    if (els.kofiBtn) els.kofiBtn.title = t("kofiTitle");
    setText(els.kofiTip, t("kofiTip"));

    // Re-apply last status message in new language
    if (lastStatus.key) {
      setStatus(lastStatus.kind, lastStatus.key, lastStatus.params || undefined, true);
    }
  }

  function updateModeChrome() {
    const corrupt = isCorruptMode();
    document.body.classList.toggle("mode-corrupt", corrupt);
    if (els.modeNormal) els.modeNormal.classList.toggle("active", !corrupt);
    if (els.modeCorrupt) els.modeCorrupt.classList.toggle("active", corrupt);
    if (els.subtitle) {
      els.subtitle.textContent = corrupt
        ? t("subtitleCorrupt")
        : t("subtitleNormal");
    }
    if (els.thSellText) {
      els.thSellText.textContent = corrupt ? t("thSellCorrupt") : t("thSell");
    }
    if (els.thSellListingsText) {
      els.thSellListingsText.textContent = corrupt
        ? t("thSellListingsCorrupt")
        : t("thSellListings");
    }
    updateSortIndicators();
  }

  function setLang(next) {
    if (next !== "en" && next !== "ru") return;
    if (lang === next) return;
    lang = next;
    localStorage.setItem(STORAGE_KEY, lang);
    applyStaticI18n();
    updateModeChrome();
    // Re-render rows / empty state with new language
    if (allFlips.length) {
      applyView();
    } else if (els.gemsBody) {
      const emptyCell = els.gemsBody.querySelector(".empty-row td");
      if (emptyCell) emptyCell.textContent = t("emptyLoading");
    }
    // Reformat age label if we have it stored on the element dataset
    if (els.statAge && els.statAge.dataset.ageSeconds) {
      els.statAge.textContent = formatAge(Number(els.statAge.dataset.ageSeconds));
    }
  }

  function setMode(next) {
    if (next !== "normal" && next !== "corrupt") return;
    if (mode === next) return;
    mode = next;
    updateModeChrome();
    if (els.gemsBody) {
      els.gemsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="9">${escapeHtml(
            t("emptyLoadingMode", { mode: next })
          )}</td>
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
    if (s < 60) return t("ageSeconds", { n: s });
    const m = Math.floor(s / 60);
    if (m < 60) return t("ageMinutes", { n: m });
    const h = Math.floor(m / 60);
    return t("ageHours", { h, m: m % 60 });
  }

  function formatCountdown(seconds) {
    if (seconds == null) return "—:—";
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  /**
   * @param {string | null} kind
   * @param {string} keyOrText  i18n key, or raw text if alreadyTranslated
   * @param {Record<string, string | number> | null} [params]
   * @param {boolean} [alreadyKey] when true, keyOrText is always an i18n key
   */
  function setStatus(kind, keyOrText, params, alreadyKey) {
    els.statusPill.classList.remove("ok", "err", "loading");
    if (kind) els.statusPill.classList.add(kind);

    // Prefer known keys so language switch can re-translate
    const knownKeys = new Set([
      "statusLoading",
      "statusUpdating",
      "statusFetching",
      "statusOk",
      "statusError",
      "statusManual",
    ]);
    if (alreadyKey || knownKeys.has(keyOrText)) {
      lastStatus = { kind, key: keyOrText, params: params || null };
      els.statusText.textContent = t(keyOrText, params || undefined);
    } else {
      lastStatus = { kind, key: null, params: null };
      els.statusText.textContent = keyOrText;
    }
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
      if (item.buy_listings < minListings || item.sell_listings < minListings)
        return false;
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
          <td colspan="9">${escapeHtml(t("emptyNone"))}</td>
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
          links.push(
            `<a class="link-btn" href="${f.trade_buy_url}" target="_blank" rel="noopener">${escapeHtml(
              t("buyL1")
            )}</a>`
          );
        }
        if (f.trade_sell_url) {
          const sellLabel = isCorruptMode()
            ? t("sellMaxCorrupt", { level: f.max_level })
            : t("sellMax", { level: f.max_level });
          links.push(
            `<a class="link-btn" href="${f.trade_sell_url}" target="_blank" rel="noopener">${escapeHtml(
              sellLabel
            )}</a>`
          );
        }
        if (f.ninja_url) {
          links.push(
            `<a class="link-btn" href="${f.ninja_url}" target="_blank" rel="noopener">${escapeHtml(
              t("ninja")
            )}</a>`
          );
        }

        const meta = isCorruptMode()
          ? t("metaCorrupt", { level: f.max_level })
          : t("metaNormal", { level: f.max_level });

        return `
          <tr class="${top}">
            <td class="col-rank">${i + 1}</td>
            <td>
              <div class="gem-cell">
                ${icon}
                <div>
                  <div class="gem-name">${escapeHtml(f.name)}</div>
                  <div class="gem-meta">${escapeHtml(meta)}</div>
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
    if (!silent) setStatus("loading", "statusUpdating");
    try {
      const res = await fetch(
        `/api/flips?min_listings=0&limit=5000&sort=profit&order=desc&mode=${encodeURIComponent(
          mode
        )}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) {
        setStatus("err", "statusError", { error: data.error });
      } else if (data.fetching && !(data.flips || []).length) {
        setStatus("loading", "statusFetching");
      } else {
        setStatus("ok", "statusOk");
      }

      allFlips = data.flips || [];
      nextRefreshIn = data.next_refresh_in;
      els.statLeague.textContent = data.league || "—";
      if (els.statAge) {
        els.statAge.dataset.ageSeconds =
          data.age_seconds != null ? String(data.age_seconds) : "";
        els.statAge.textContent = formatAge(data.age_seconds);
      }
      applyView();
      updateCountdown();
    } catch (err) {
      setStatus("err", "statusError", { error: err.message || err });
      els.gemsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="9">${escapeHtml(
            t("emptyError", { error: err.message || err })
          )}</td>
        </tr>`;
    }
  }

  async function forceRefresh() {
    els.refreshBtn.disabled = true;
    setStatus("loading", "statusManual");
    try {
      await fetch("/api/refresh", { method: "POST" });
      await loadFlips();
    } catch (err) {
      setStatus("err", "statusError", { error: err.message || err });
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
  if (els.modeNormal)
    els.modeNormal.addEventListener("click", () => setMode("normal"));
  if (els.modeCorrupt)
    els.modeCorrupt.addEventListener("click", () => setMode("corrupt"));
  document.querySelector(".mode-toggle:not(.lang-toggle)")?.addEventListener(
    "click",
    (ev) => {
      const btn = ev.target.closest("[data-mode]");
      if (!btn) return;
      setMode(btn.getAttribute("data-mode"));
    }
  );

  if (els.langEn) els.langEn.addEventListener("click", () => setLang("en"));
  if (els.langRu) els.langRu.addEventListener("click", () => setLang("ru"));
  els.langToggle?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-lang]");
    if (!btn) return;
    setLang(btn.getAttribute("data-lang"));
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

  applyStaticI18n();
  updateModeChrome();
  loadFlips();
})();
