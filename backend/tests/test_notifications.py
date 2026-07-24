from app.agent.plugins import PeterPlugin
from app.chat.manager import current_conn_id, manager
from app.notifications import service as notifications
from app.schemas import CreateNotificationInput, NotificationEvent


async def test_push_targets_explicit_conn(monkeypatch):
    sent = []

    async def fake_send(conn_id, event):
        sent.append((conn_id, event))

    monkeypatch.setattr(manager, "send", fake_send)

    note = await notifications.push(
        CreateNotificationInput(title="t", body="b", severity="chaos"), conn_id="c1"
    )

    assert note.title == "t" and note.severity == "chaos"
    assert len(sent) == 1
    conn_id, event = sent[0]
    assert conn_id == "c1"
    assert isinstance(event, NotificationEvent)
    assert event.notification.title == "t"


async def test_push_uses_contextvar(monkeypatch):
    sent = []

    async def fake_send(conn_id, event):
        sent.append(conn_id)

    monkeypatch.setattr(manager, "send", fake_send)
    current_conn_id.set("ctx-conn")

    await notifications.push(CreateNotificationInput(title="t", body="b"))
    assert sent == ["ctx-conn"]


async def test_push_broadcasts_when_no_target(monkeypatch):
    broadcast = []

    async def fake_broadcast(event):
        broadcast.append(event)

    monkeypatch.setattr(manager, "broadcast", fake_broadcast)
    current_conn_id.set(None)

    await notifications.push(CreateNotificationInput(title="t", body="b"))
    assert len(broadcast) == 1


async def test_plugin_create_notification_pushes(monkeypatch):
    captured = []

    async def fake_push(data, conn_id=None):
        captured.append(data)
        from app.schemas import Notification

        return Notification(title=data.title, body=data.body, severity=data.severity)

    monkeypatch.setattr(notifications, "push", fake_push)

    result = await PeterPlugin().create_notification(
        title="Beer", body="buy beer", severity="chaos"
    )
    assert result == "ok"
    assert len(captured) == 1
    assert captured[0].title == "Beer" and captured[0].severity == "chaos"


async def test_plugin_clamps_bad_severity(monkeypatch):
    captured = []

    async def fake_push(data, conn_id=None):
        captured.append(data)
        from app.schemas import Notification

        return Notification(title=data.title, body=data.body, severity=data.severity)

    monkeypatch.setattr(notifications, "push", fake_push)

    await PeterPlugin().create_notification(title="x", body="y", severity="nonsense")
    assert captured[0].severity == "info"
