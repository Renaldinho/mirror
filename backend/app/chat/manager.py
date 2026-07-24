"""Connection registry + per-connection chat history.

The Ollama/SK API is stateless, so we hold each client's message history here and
hand it back to the agent on every turn. This module also carries the "which
connection is the agent currently acting for" context via a contextvar, so a tool
call deep inside the agent loop knows which UI to push a notification to.
"""
from __future__ import annotations

from contextvars import ContextVar
from typing import Optional
from uuid import uuid4

from fastapi import WebSocket

from app.schemas import ChatMessage, OutboundEvent

# Set for the duration of an agent run so tools can target the right client.
current_conn_id: ContextVar[Optional[str]] = ContextVar("current_conn_id", default=None)


class ChatManager:
    def __init__(self) -> None:
        self._connections: dict[str, WebSocket] = {}
        self._histories: dict[str, list[ChatMessage]] = {}

    # --- connection lifecycle ---
    async def connect(self, ws: WebSocket) -> str:
        await ws.accept()
        conn_id = uuid4().hex
        self._connections[conn_id] = ws
        self._histories.setdefault(conn_id, [])
        return conn_id

    def disconnect(self, conn_id: str) -> None:
        self._connections.pop(conn_id, None)
        self._histories.pop(conn_id, None)

    def connection_ids(self) -> list[str]:
        return list(self._connections)

    # --- history ---
    def history(self, conn_id: str) -> list[ChatMessage]:
        return self._histories.setdefault(conn_id, [])

    def append(self, conn_id: str, message: ChatMessage) -> None:
        self._histories.setdefault(conn_id, []).append(message)

    # --- sending ---
    async def send(self, conn_id: str, event: OutboundEvent) -> None:
        ws = self._connections.get(conn_id)
        if ws is not None:
            await ws.send_json(event.model_dump(mode="json"))

    async def broadcast(self, event: OutboundEvent) -> None:
        payload = event.model_dump(mode="json")
        for ws in list(self._connections.values()):
            await ws.send_json(payload)


# App-wide singleton.
manager = ChatManager()
