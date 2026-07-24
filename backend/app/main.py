"""FastAPI app: WebSocket chat endpoint + lifecycle wiring.

Flow per client message:
  receive user.message
    -> record it in history
    -> set current_conn_id so tools notify THIS client
    -> stream Peter's reply as assistant.delta events
    -> record + send assistant.done
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import TypeAdapter, ValidationError

from app import scheduler
from app.agent.service import agent
from app.chat.manager import current_conn_id, manager
from app.config import settings
from app.schemas import (
    AssistantDeltaEvent,
    AssistantDoneEvent,
    ChatMessage,
    ErrorEvent,
    InboundEvent,
    UserMessageEvent,
)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("peter")

_inbound_adapter: TypeAdapter[UserMessageEvent] = TypeAdapter(InboundEvent)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown()


app = FastAPI(title="Peter Griffin Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "model": settings.ollama_model}


async def _handle_user_message(conn_id: str, event: UserMessageEvent) -> None:
    manager.append(conn_id, ChatMessage(role="user", text=event.text))
    current_conn_id.set(conn_id)  # tools raised during this run target this client

    history = manager.history(conn_id)[:-1]  # exclude the message we just added
    parts: list[str] = []
    async for chunk in agent.stream_reply(history=history, user_text=event.text):
        parts.append(chunk)
        await manager.send(conn_id, AssistantDeltaEvent(text=chunk))

    reply = ChatMessage(role="assistant", text="".join(parts))
    manager.append(conn_id, reply)
    await manager.send(conn_id, AssistantDoneEvent(message=reply))


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    conn_id = await manager.connect(ws)
    log.info("client connected: %s", conn_id)
    try:
        while True:
            raw = await ws.receive_json()
            try:
                event = _inbound_adapter.validate_python(raw)
            except ValidationError as e:
                await manager.send(conn_id, ErrorEvent(message=f"bad event: {e.errors()}"))
                continue

            if isinstance(event, UserMessageEvent):
                try:
                    await _handle_user_message(conn_id, event)
                except Exception as e:  # noqa: BLE001
                    log.exception("agent turn failed")
                    await manager.send(conn_id, ErrorEvent(message=f"Peter broke: {e}"))
    except WebSocketDisconnect:
        log.info("client disconnected: %s", conn_id)
    finally:
        manager.disconnect(conn_id)
