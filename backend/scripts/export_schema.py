"""Dump JSON Schema for the shared WS model so the frontend can generate TS types.

Run:  python -m scripts.export_schema
Output: schema/ws-events.schema.json  (consumed by frontend `npm run gen:types`)

This is the bridge that keeps the Angular types in lockstep with the Pydantic
source of truth in app/schemas.py.
"""
from __future__ import annotations

import json
from pathlib import Path

from pydantic import TypeAdapter

from app.schemas import WsEvent

OUT = Path(__file__).resolve().parents[1] / "schema" / "ws-events.schema.json"


def main() -> None:
    # Default ref_template is "#/$defs/{model}", matching pydantic's `$defs` key,
    # which json-schema-to-typescript understands.
    schema = TypeAdapter(WsEvent).json_schema()
    schema.setdefault("title", "WsEvent")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(schema, indent=2), encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
