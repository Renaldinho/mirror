"""Turns a validated notification into a WebSocket event the UI collects.

Reactive path: called by the create_notification agent tool during a chat turn.
Proactive path: called by the scheduler after an unprompted agent run.
"""
from __future__ import annotations

from typing import Optional

from app.chat.manager import current_conn_id, manager
from app.schemas import CreateNotificationInput, Notification, NotificationEvent


async def push(data: CreateNotificationInput, conn_id: Optional[str] = None) -> Notification:
    """Persist-ish (in-memory for now) + push a notification to the target client.

    If no conn_id is given we fall back to the connection the current agent run is
    acting for (set via the `current_conn_id` contextvar). If neither is available
    the notification is broadcast to every connected client.
    """
    notification = Notification(
        title=data.title, body=data.body, severity=data.severity
    )
    event = NotificationEvent(notification=notification)

    target = conn_id or current_conn_id.get()
    if target is not None:
        await manager.send(target, event)
    else:
        await manager.broadcast(event)

    return notification
