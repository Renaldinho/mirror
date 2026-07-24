"""NOTIFY: line filter for models without reliable native tool-calling.

When `OLLAMA_SUPPORTS_TOOLS=false`, the persona is told to emit lines like:
    NOTIFY: {"title": "...", "body": "...", "severity": "chaos"}
This incremental filter strips those lines out of the streamed reply and surfaces
the parsed notification inputs, so the same UI contract holds without tool support.
"""
from __future__ import annotations

import json
from typing import Optional

from app.schemas import CreateNotificationInput

_PREFIX = "NOTIFY:"


def _parse(line: str) -> Optional[CreateNotificationInput]:
    payload = line.strip()[len(_PREFIX):].strip()
    try:
        data = json.loads(payload)
        return CreateNotificationInput.model_validate(data)
    except Exception:
        return None


class NotifyLineFilter:
    """Feed streamed text chunks; get back display text with NOTIFY lines removed.

    Collected notifications accumulate in `.notifications` for the caller to push.
    """

    def __init__(self) -> None:
        self._buffer = ""
        self.notifications: list[CreateNotificationInput] = []

    def feed(self, chunk: str) -> str:
        """Return the text safe to display now (whole NOTIFY lines withheld)."""
        self._buffer += chunk
        out: list[str] = []
        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            out.append(self._handle_line(line, terminated=True))
        return "".join(out)

    def flush(self) -> str:
        """Handle whatever is left once the stream ends."""
        remaining, self._buffer = self._buffer, ""
        return self._handle_line(remaining, terminated=False)

    def _handle_line(self, line: str, terminated: bool) -> str:
        if line.strip().startswith(_PREFIX):
            note = _parse(line)
            if note is not None:
                self.notifications.append(note)
            return ""  # swallow the NOTIFY line entirely
        return line + ("\n" if terminated else "")
