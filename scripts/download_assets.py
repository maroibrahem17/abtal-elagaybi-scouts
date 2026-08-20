import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public" / "images"

DOWNLOADS = {
    "hero/church.jpg": [
        "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1548625149-220365b2ac43?auto=format&fit=crop&w=1600&q=80",
        "https://upload.wikimedia.org/wikipedia/commons/4/4a/Hanging_Church_Cairo_2010.jpg",
    ],
    "hero/adventure.jpg": [
        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1473580044384-7ba9967fe375?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1489493887464-892be6d1daae?auto=format&fit=crop&w=1600&q=80",
    ],
    "products/whistle.jpg": [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80",
    ],
    "products/scarf.jpg": [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
    ],
    "products/uniform.jpg": [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80",
    ],
    "products/belt.jpg": [
        "https://images.unsplash.com/photo-1624222247344-550fb60583c2?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    ],
    "footer/fayoum-map.jpg": [
        "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80",
    ],
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}


def download(rel: str, urls: list[str]) -> None:
    dest = PUB / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    last_err = None
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=45) as response:
                data = response.read()
            if len(data) < 4000:
                raise RuntimeError(f"too small: {len(data)}")
            dest.write_bytes(data)
            print(f"OK {rel} ({len(data)} bytes) from {url[:70]}")
            return
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"FAIL {rel} :: {exc}")
    raise SystemExit(f"Could not download {rel}: {last_err}")


if __name__ == "__main__":
    for rel, urls in DOWNLOADS.items():
        download(rel, urls)
    print("done")
