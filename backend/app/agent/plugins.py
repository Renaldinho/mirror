"""Agent tools = plain methods with @kernel_function.

Semantic Kernel exposes these to the model and, with auto function-calling on,
runs the call -> execute -> feed-result-back loop for us. Two flavours:
  - data-fetch tools (get_time) the model calls to COLLECT info for its reply.
  - action tools (create_notification) the model calls to DO something (emit a UI
    notification).
Both are just decorated methods.
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from semantic_kernel.functions import kernel_function

from app.notifications import service as notifications
from app.schemas import CreateNotificationInput


class PeterPlugin:
    @kernel_function(
        name="create_notification",
        description="Pop a notification onto the user's screen.",
    )
    async def create_notification(
        self,
        title: Annotated[str, "Short notification title."],
        body: Annotated[str, "The notification message body."],
        severity: Annotated[
            str, "One of: info, warn, chaos."
        ] = "info",
    ) -> Annotated[str, "Result status."]:
        if severity not in ("info", "warn", "chaos"):
            severity = "info"
        await notifications.push(
            CreateNotificationInput(title=title, body=body, severity=severity)  # type: ignore[arg-type]
        )
        return "ok"

    @kernel_function(
        name="get_time",
        description="Get the current local date and time.",
    )
    def get_time(self) -> Annotated[str, "Current ISO-8601 timestamp."]:
        return datetime.now().isoformat(timespec="seconds")
