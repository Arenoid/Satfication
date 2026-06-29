import json
import time
from pathlib import Path
import requests


CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok = True)

CACHE_FILE = CACHE_DIR/"tle_cache.json"


NORAD_IDS = [
    25544,
    20580,
    48274,
    39084,
    40697,
    42063,
    27424,
    25994,
    37849,
    33053,
    28485,
    25867,
    43013,
    33591,
    28654,
    38771,
    43689,
    43613,
    29108,
    28376,
    27607,
    28884,
    29499,
    35937,
    25338,
    25394,
    39227,
    41765,
    42965,
    43114,
    44387,
    44390,
    44713,
    44874,
    45265,
    45727,
    45920,
    46984,
    47201,
    47954,
    48097,
    48275,
    48915,
    49260,
    51074,
    52750,
    54216,
    54234,
    55058,
    55059,
    55060,
    55061,
    55062,
    55063,
    55064,
    55065,
    55066,
    55067,
    55068,
    55069,
    55070,
    55071,
    55072,
    55073,
    55074,
    55075,
    55076,
    55077,
    55078,
    55079,
    55080
]

if CACHE_FILE.exists():
    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
    except (json.JSONDecodeError, OSError):
        cache = {}
else:
    cache = {}

for norad in NORAD_IDS:
    print(f"Fetching {norad}...")
    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={norad}&FORMAT=TLE"

    try:
        r = requests.get(
            url,
            timeout = 20,
            headers={"User-Agent": "Satfication/1.0"}
        )

        r.raise_for_status()

        lines = [line.strip() for line in r.text.splitlines() if line.strip()]

        if len(lines)<3:
            print("No TLE FOUND")
            continue

        cache[str(norad)] = {
            "timestamp": time.time(),
            "tle": lines[:3]
        }

        print(f"Cached{norad}")

    except Exception as e:
        print(f"Failed {norad} : {e}")

with open(CACHE_FILE, "w") as f:
    json.dump(cache,f,indent=2)

print(f"Done!")

