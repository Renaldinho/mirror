"""The single source of truth for the data model shared with the Angular frontend.

These Pydantic models do three jobs:
  1. Runtime validation of inbound/outbound WebSocket payloads (backend).
  2. The tool-input contract the agent fills in (`CreateNotificationInput`).
  3. The basis for the TypeScript types generated for the frontend
     (see `scripts/export_schema.py` -> frontend `npm run gen:types`).

Change a field here, regenerate the frontend types, and the Angular compiler will
flag every stale usage. One definition, three consumers.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Literal, Union
from uuid import uuid4

from pydantic import BaseModel, Field

Severity = Literal["info", "warn", "chaos"]
Role = Literal["user", "assistant"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return uuid4().hex


# --------------------------------------------------------------------------- #
# Core domain objects
# --------------------------------------------------------------------------- #
class ChatMessage(BaseModel):
    id: str = Field(default_factory=_new_id)
    role: Role
    text: str
    created_at: datetime = Field(default_factory=_now)


class Notification(BaseModel):
    id: str = Field(default_factory=_new_id)
    kind: str = "peter"
    title: str
    body: str
    severity: Severity = "info"
    created_at: datetime = Field(default_factory=_now)


class CreateNotificationInput(BaseModel):
    """The arguments the agent supplies when it calls the create_notification tool."""

    title: str
    body: str
    severity: Severity = "info"


# --------------------------------------------------------------------------- #
# WebSocket event envelope (discriminated union on `type`)
# --------------------------------------------------------------------------- #
# client -> server
class UserMessageEvent(BaseModel):
    type: Literal["user.message"] = "user.message"
    text: str


# server -> client
class AssistantDeltaEvent(BaseModel):
    type: Literal["assistant.delta"] = "assistant.delta"
    text: str  # a streamed chunk of Peter's reply


class AssistantDoneEvent(BaseModel):
    type: Literal["assistant.done"] = "assistant.done"
    message: ChatMessage


class NotificationEvent(BaseModel):
    type: Literal["notification"] = "notification"
    notification: Notification


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str


# Inbound = what the client may send us.
InboundEvent = Annotated[UserMessageEvent, Field(discriminator="type")]

# Outbound = what we may send the client.
OutboundEvent = Annotated[
    Union[AssistantDeltaEvent, AssistantDoneEvent, NotificationEvent, ErrorEvent],
    Field(discriminator="type"),
]

# The full union, used to generate a single TS type for the frontend.
WsEvent = Annotated[
    Union[
        UserMessageEvent,
        AssistantDeltaEvent,
        AssistantDoneEvent,
        NotificationEvent,
        ErrorEvent,
    ],
    Field(discriminator="type"),
]
