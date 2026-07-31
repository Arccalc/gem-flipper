# Gem Flipper

Local Path of Exile tracker: finds gems that are profitable to **buy at level 1** and **sell at max level**, using data from [poe.ninja](https://poe.ninja/poe1/economy/allflame/skill-gems?level=1&quality=0-19&corrupted=No).

## Features

- Pulls Skill Gems from the poe.ninja API (default league: **Allflame**)
- Filters: **quality 0** (0–19 bucket on ninja) and **uncorrupted**
- For each gem, pairs **L1** price with the **highest available level** (20 / 5 / 3, etc.)
- Calculates **profit** (max − L1) and **ROI**
- Considers **listing counts** on both sides (so prices are more reliable)
- **Corrupt mode**: L1 uncorrupted → max corrupted (+1 level)
- **Auto-refresh every 20 minutes**
- **UI language**: English / Russian (toggle in the header)

## Quick start

### Option 1: No Python install (Windows EXE)

1. Open **[Releases](https://github.com/Arccalc/gem-flipper/releases)** on the right.
2. Download **`GemFlipper-v1.0.0-Windows.zip`** and extract it.
3. Run **`GemFlipper.exe`**.
4. Your browser opens at **http://127.0.0.1:8765**.

---

### Option 2: From source with `run.bat` (Windows)

1. Download the ZIP (**Code** → **Download ZIP**) and extract it.
2. Run **`run.bat`** (requires Python installed).
3. Open **http://127.0.0.1:8765** in your browser.

---

### Option 3: Command line / Git Bash

1. Clone the repo and enter the folder:
```bash
git clone https://github.com/Arccalc/gem-flipper.git
cd gem-flipper
```
2. Create and activate a virtual environment:
```bash
# Create:
python -m venv .venv

# Activate (Windows):
.venv\Scripts\activate

# Activate (Linux / macOS):
# source .venv/bin/activate
```
3. Install dependencies and run:
```bash
pip install -r requirements.txt
python app.py
```
4. Open **http://127.0.0.1:8765** in your browser.

## UI filters

| Filter | Meaning |
|--------|---------|
| Min listings | Minimum on **both** sides (L1 and max). Higher = more reliable |
| Min profit | Drop small chaos spreads |
| Min ROI % | Drop expensive gems with weak returns |
| Search | Gem name |
| Sort | profit / ROI / liquidity / prices (click column headers) |

## API

- `GET /api/flips?min_listings=20&min_profit=0&min_roi=0&search=&sort=profit&mode=normal|corrupt`
- `GET /api/status`
- `POST /api/refresh` — force refresh

## Data source

```
GET https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=Allflame&type=SkillGem
```

Do not hammer the API: ninja data already updates about every 15 minutes. This app caches for 20 minutes.

## Support the developer

If Gem Flipper saves you time in trade, consider supporting development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/pixelcraft404)
