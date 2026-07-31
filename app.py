"""
Gem Flipper — find best L1 → max level skill gem flips from poe.ninja
(quality 0, uncorrupted, with listing liquidity).
"""

from __future__ import annotations

import asyncio
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, asdict
from typing import Any

import httpx
from fastapi import FastAPI, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import uvicorn
import webbrowser
import threading

POE_NINJA_ITEM_OVERVIEW = (
    "https://poe.ninja/poe1/api/economy/stash/current/item/overview"
)
POE_NINJA_LEAGUES = "https://poe.ninja/poe1/api/economy/leagues"
USER_AGENT = "GemFlipper/1.0 (local tool; contact: local-user)"
REFRESH_SECONDS = 20 * 60  # 20 minutes
DEFAULT_LEAGUE = "Allflame"


@dataclass
class GemFlip:
    name: str
    icon: str | None
    details_id: str | None
    max_level: int
    buy_chaos: float
    sell_chaos: float
    profit_chaos: float
    buy_divine: float
    sell_divine: float
    profit_divine: float
    buy_listings: int
    sell_listings: int
    min_listings: int
    buy_count: int
    sell_count: int
    roi_percent: float
    ninja_url: str
    trade_buy_url: str | None
    trade_sell_url: str | None


class GemDataStore:
    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.raw_lines: list[dict[str, Any]] = []
        self.flips: list[GemFlip] = []
        self.corrupt_flips: list[GemFlip] = []
        self.league: str = DEFAULT_LEAGUE
        self.last_fetch_at: float | None = None
        self.last_error: str | None = None
        self.fetching: bool = False
        self.leagues: list[dict[str, str]] = []

    @property
    def age_seconds(self) -> float | None:
        if self.last_fetch_at is None:
            return None
        return time.time() - self.last_fetch_at

    @property
    def next_refresh_in(self) -> float | None:
        if self.last_fetch_at is None:
            return None
        return max(0.0, REFRESH_SECONDS - (time.time() - self.last_fetch_at))


store = GemDataStore()


def is_quality_zero(gem: dict[str, Any]) -> bool:
    """poe.ninja stores non-20% gems as gemQuality missing/null/0."""
    q = gem.get("gemQuality")
    return q is None or q == 0


def _encode_trade_query(payload: dict[str, Any], league: str) -> str:
    import json
    from urllib.parse import quote

    raw = json.dumps(payload, separators=(",", ":"))
    return f"https://www.pathofexile.com/trade/search/{quote(league)}?q={quote(raw)}"


def build_trade_url(
    gem: dict[str, Any],
    name: str,
    level: int,
    league: str,
    *,
    corrupted: bool = False,
) -> str:
    """Prefer poe.ninja tradeFilter; otherwise build a quality-0 search."""
    corrupted_opt = "true" if corrupted else "false"
    trade_filter = gem.get("tradeFilter")
    if isinstance(trade_filter, dict) and trade_filter.get("query"):
        # clone and tighten level/quality/corrupted for our use-case
        import copy

        payload = copy.deepcopy(trade_filter)
        query = payload.setdefault("query", {})
        filters = query.setdefault("filters", {})
        misc = filters.setdefault("misc_filters", {}).setdefault("filters", {})
        misc["gem_level"] = {"min": level, "max": level}
        misc["corrupted"] = {"option": corrupted_opt}
        # quality 0 only (ninja 0-19 bucket ≈ unboosted gems)
        misc["quality"] = {"min": 0, "max": 0}
        query.setdefault("status", {"option": "securable"})
        return _encode_trade_query(payload, league)

    # Fallback: plain type search by gem name
    payload = {
        "query": {
            "status": {"option": "securable"},
            "type": name,
            "filters": {
                "misc_filters": {
                    "filters": {
                        "gem_level": {"min": level, "max": level},
                        "corrupted": {"option": corrupted_opt},
                        "quality": {"min": 0, "max": 0},
                    }
                }
            },
        }
    }
    return _encode_trade_query(payload, league)


def _pick_best_listing(levels: dict[int, dict[str, Any]], level: int, gem: dict[str, Any]) -> None:
    prev = levels.get(level)
    if prev is None or (gem.get("listingCount") or 0) > (prev.get("listingCount") or 0):
        levels[level] = gem


def _make_flip(
    name: str,
    buy: dict[str, Any],
    sell: dict[str, Any],
    sell_level: int,
    league: str,
    *,
    sell_corrupted: bool = False,
) -> GemFlip:
    buy_chaos = float(buy.get("chaosValue") or 0)
    sell_chaos = float(sell.get("chaosValue") or 0)
    profit = sell_chaos - buy_chaos
    buy_div = float(buy.get("divineValue") or 0)
    sell_div = float(sell.get("divineValue") or 0)
    profit_div = sell_div - buy_div
    buy_list = int(buy.get("listingCount") or 0)
    sell_list = int(sell.get("listingCount") or 0)
    roi = (profit / buy_chaos * 100.0) if buy_chaos > 0 else (99999.0 if profit > 0 else 0.0)
    details = sell.get("detailsId") or buy.get("detailsId") or ""
    league_slug = league.lower().replace(" ", "-")

    return GemFlip(
        name=name,
        icon=buy.get("icon") or sell.get("icon"),
        details_id=details or None,
        max_level=int(sell_level),
        buy_chaos=round(buy_chaos, 2),
        sell_chaos=round(sell_chaos, 2),
        profit_chaos=round(profit, 2),
        buy_divine=round(buy_div, 3),
        sell_divine=round(sell_div, 3),
        profit_divine=round(profit_div, 3),
        buy_listings=buy_list,
        sell_listings=sell_list,
        min_listings=min(buy_list, sell_list),
        buy_count=int(buy.get("count") or 0),
        sell_count=int(sell.get("count") or 0),
        roi_percent=round(roi, 1),
        ninja_url=(
            f"https://poe.ninja/poe1/economy/{league_slug}/skill-gems/{details}"
            if details
            else f"https://poe.ninja/poe1/economy/{league_slug}/skill-gems"
        ),
        trade_buy_url=build_trade_url(buy, name, 1, league, corrupted=False),
        trade_sell_url=build_trade_url(
            sell, name, int(sell_level), league, corrupted=sell_corrupted
        ),
    )


def build_flips(lines: list[dict[str, Any]], league: str) -> list[GemFlip]:
    """Group quality-0 uncorrupted gems and pair L1 with highest level."""
    by_name: dict[str, dict[int, dict[str, Any]]] = {}

    for gem in lines:
        if gem.get("corrupted"):
            continue
        if not is_quality_zero(gem):
            continue
        level = gem.get("gemLevel")
        if level is None:
            continue
        name = gem.get("name") or gem.get("baseType")
        if not name:
            continue
        _pick_best_listing(by_name.setdefault(name, {}), int(level), gem)

    flips: list[GemFlip] = []
    for name, levels in by_name.items():
        if 1 not in levels:
            continue
        max_level = max(levels.keys())
        if max_level <= 1:
            continue
        flips.append(_make_flip(name, levels[1], levels[max_level], max_level, league))

    flips.sort(key=lambda f: (f.profit_chaos, f.min_listings), reverse=True)
    return flips


def build_corrupt_flips(lines: list[dict[str, Any]], league: str) -> list[GemFlip]:
    """Pair L1 quality-0 uncorrupted with highest quality-0 corrupted level.

    Regular skill gems → usually L21c (+1 over 20).
    Exceptional (Enlighten/Empower/Enhance) → L4c.
    Awakened exceptional → L5c / L6c when present.
    Same idea as poe.ninja skill-gems filtered by high level + quality 0–19.
    """
    l1_by_name: dict[str, dict[str, Any]] = {}
    # name -> level -> best listing among corrupted q0
    corrupted_by_name: dict[str, dict[int, dict[str, Any]]] = {}

    for gem in lines:
        if not is_quality_zero(gem):
            continue
        level = gem.get("gemLevel")
        if level is None:
            continue
        level = int(level)
        name = gem.get("name") or gem.get("baseType")
        if not name:
            continue

        if level == 1 and not gem.get("corrupted"):
            prev = l1_by_name.get(name)
            if prev is None or (gem.get("listingCount") or 0) > (prev.get("listingCount") or 0):
                l1_by_name[name] = gem
        elif gem.get("corrupted"):
            _pick_best_listing(corrupted_by_name.setdefault(name, {}), level, gem)

    flips: list[GemFlip] = []
    for name, buy in l1_by_name.items():
        levels = corrupted_by_name.get(name)
        if not levels:
            continue
        max_level = max(levels.keys())
        # Need a real corrupt upgrade over L1 (e.g. 21, 4, 5…)
        if max_level <= 1:
            continue
        sell = levels[max_level]
        flips.append(
            _make_flip(name, buy, sell, max_level, league, sell_corrupted=True)
        )

    flips.sort(key=lambda f: (f.profit_chaos, f.min_listings), reverse=True)
    return flips


async def fetch_leagues(client: httpx.AsyncClient) -> list[dict[str, str]]:
    r = await client.get(POE_NINJA_LEAGUES)
    r.raise_for_status()
    data = r.json()
    return [{"id": x["id"], "name": x["name"]} for x in data]


async def fetch_skill_gems(client: httpx.AsyncClient, league: str) -> list[dict[str, Any]]:
    r = await client.get(
        POE_NINJA_ITEM_OVERVIEW,
        params={"league": league, "type": "SkillGem"},
    )
    r.raise_for_status()
    data = r.json()
    return data.get("lines") or []


async def refresh_data(league: str | None = None, force: bool = False) -> None:
    async with store.lock:
        if store.fetching:
            return
        target = league or store.league
        if (
            not force
            and store.last_fetch_at is not None
            and store.league == target
            and (time.time() - store.last_fetch_at) < REFRESH_SECONDS
        ):
            return
        store.fetching = True

    try:
        async with httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=60.0,
            follow_redirects=True,
        ) as client:
            if not store.leagues:
                try:
                    leagues = await fetch_leagues(client)
                    store.leagues = leagues
                except Exception:
                    store.leagues = [{"id": DEFAULT_LEAGUE, "name": DEFAULT_LEAGUE}]

            lines = await fetch_skill_gems(client, target)
            flips = build_flips(lines, target)
            corrupt_flips = build_corrupt_flips(lines, target)

        async with store.lock:
            store.raw_lines = lines
            store.flips = flips
            store.corrupt_flips = corrupt_flips
            store.league = target
            store.last_fetch_at = time.time()
            store.last_error = None
    except Exception as exc:
        async with store.lock:
            store.last_error = str(exc)
    finally:
        async with store.lock:
            store.fetching = False


async def background_refresh_loop() -> None:
    # Initial fetch
    await refresh_data(force=True)
    while True:
        await asyncio.sleep(30)
        try:
            if store.next_refresh_in is None or store.next_refresh_in <= 0:
                await refresh_data(force=True)
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(background_refresh_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


import os
import sys

def get_resource_path(relative_path: str) -> str:
    """Get absolute path to resource, works for dev and for PyInstaller"""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

app = FastAPI(title="Gem Flipper", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=get_resource_path("static")), name="static")
templates = Jinja2Templates(directory=get_resource_path("templates"))

# Bump when static JS/CSS change so browsers don't keep a stale app.js
STATIC_VERSION = "3"


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "refresh_seconds": REFRESH_SECONDS,
            "default_league": store.league,
            "static_version": STATIC_VERSION,
        },
    )


@app.middleware("http")
async def no_cache_static(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return response



@app.get("/api/status")
async def api_status():
    return {
        "league": store.league,
        "leagues": store.leagues,
        "last_fetch_at": store.last_fetch_at,
        "age_seconds": store.age_seconds,
        "next_refresh_in": store.next_refresh_in,
        "refresh_interval": REFRESH_SECONDS,
        "fetching": store.fetching,
        "error": store.last_error,
        "total_flips": len(store.flips),
        "total_corrupt_flips": len(store.corrupt_flips),
        "total_raw_lines": len(store.raw_lines),
    }


@app.get("/api/flips")
async def api_flips(
    min_listings: int = Query(0, ge=0, description="Min listings on BOTH buy and sell sides"),
    min_buy_listings: int | None = Query(None, ge=0),
    min_sell_listings: int | None = Query(None, ge=0),
    min_profit: float | None = Query(None),
    max_profit: float | None = Query(None),
    min_roi: float | None = Query(None),
    max_roi: float | None = Query(None),
    min_buy: float | None = Query(None),
    max_buy: float | None = Query(None),
    min_sell: float | None = Query(None),
    max_sell: float | None = Query(None),
    min_level: int | None = Query(None, ge=1),
    max_level: int | None = Query(None, ge=1),
    search: str = Query("", description="Filter by gem name"),
    mode: str = Query(
        "normal",
        pattern="^(normal|corrupt)$",
        description="normal = L1→max uncorrupted; corrupt = L1→L21 corrupted",
    ),
    limit: int = Query(1000, ge=1, le=5000),
    sort: str = Query(
        "profit",
        pattern="^(profit|roi|buy|sell|listings|buy_listings|sell_listings|name|max_level)$",
    ),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    source = store.corrupt_flips if mode == "corrupt" else store.flips
    if not source and not store.fetching:
        await refresh_data(force=True)
        source = store.corrupt_flips if mode == "corrupt" else store.flips

    q = search.strip().lower()
    buy_list_min = min_buy_listings if min_buy_listings is not None else min_listings
    sell_list_min = min_sell_listings if min_sell_listings is not None else min_listings

    results = []
    for f in source:
        if f.buy_listings < buy_list_min or f.sell_listings < sell_list_min:
            continue
        if min_profit is not None and f.profit_chaos < min_profit:
            continue
        if max_profit is not None and f.profit_chaos > max_profit:
            continue
        if min_roi is not None and f.roi_percent < min_roi:
            continue
        if max_roi is not None and f.roi_percent > max_roi:
            continue
        if min_buy is not None and f.buy_chaos < min_buy:
            continue
        if max_buy is not None and f.buy_chaos > max_buy:
            continue
        if min_sell is not None and f.sell_chaos < min_sell:
            continue
        if max_sell is not None and f.sell_chaos > max_sell:
            continue
        if min_level is not None and f.max_level < min_level:
            continue
        if max_level is not None and f.max_level > max_level:
            continue
        if q and q not in f.name.lower():
            continue
        results.append(f)

    reverse = order == "desc"
    key_map = {
        "profit": lambda x: x.profit_chaos,
        "roi": lambda x: x.roi_percent,
        "buy": lambda x: x.buy_chaos,
        "sell": lambda x: x.sell_chaos,
        "listings": lambda x: x.min_listings,
        "buy_listings": lambda x: x.buy_listings,
        "sell_listings": lambda x: x.sell_listings,
        "name": lambda x: x.name.lower(),
        "max_level": lambda x: x.max_level,
    }
    results.sort(key=key_map[sort], reverse=reverse)
    results = results[:limit]

    return {
        "league": store.league,
        "mode": mode,
        "last_fetch_at": store.last_fetch_at,
        "age_seconds": store.age_seconds,
        "next_refresh_in": store.next_refresh_in,
        "refresh_interval": REFRESH_SECONDS,
        "fetching": store.fetching,
        "error": store.last_error,
        "total_unfiltered": len(source),
        "count": len(results),
        "flips": [asdict(f) for f in results],
    }


@app.post("/api/refresh")
async def api_refresh(league: str | None = None):
    target = league or store.league
    await refresh_data(league=target, force=True)
    return JSONResponse(
        {
            "ok": store.last_error is None,
            "error": store.last_error,
            "league": store.league,
            "total_flips": len(store.flips),
            "total_corrupt_flips": len(store.corrupt_flips),
            "last_fetch_at": store.last_fetch_at,
        }
    )


if __name__ == "__main__":
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:8765")

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=8765, reload=False)
