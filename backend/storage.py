import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_STORE_PATH = DATA_DIR / "embeddings.json"


def save_records(records: list[dict[str, Any]], path: Path = DEFAULT_STORE_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, indent=2), encoding="utf-8")


def load_records(path: Path = DEFAULT_STORE_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    return json.loads(path.read_text(encoding="utf-8"))
