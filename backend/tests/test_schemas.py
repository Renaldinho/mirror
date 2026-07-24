from pydantic import TypeAdapter, ValidationError

from app.schemas import (
    InboundEvent,
    Notification,
    NotificationEvent,
    UserMessageEvent,
    WsEvent,
)


def test_inbound_discriminates_user_message():
    ev = TypeAdapter(InboundEvent).validate_python({"type": "user.message", "text": "hi"})
    assert isinstance(ev, UserMessageEvent)
    assert ev.text == "hi"


def test_inbound_rejects_server_event():
    # assistant.delta is server->client; the client must not be able to send it.
    try:
        TypeAdapter(InboundEvent).validate_python({"type": "assistant.delta", "text": "x"})
    except ValidationError:
        return
    raise AssertionError("inbound adapter should reject server-only events")


def test_notification_event_roundtrip():
    n = Notification(title="t", body="b", severity="warn")
    ev = NotificationEvent(notification=n)
    dumped = ev.model_dump(mode="json")
    assert dumped["type"] == "notification"
    assert dumped["notification"]["severity"] == "warn"
    # re-parse through the full union
    parsed = TypeAdapter(WsEvent).validate_python(dumped)
    assert isinstance(parsed, NotificationEvent)
