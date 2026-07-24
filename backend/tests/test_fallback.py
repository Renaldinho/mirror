from app.agent.fallback import NotifyLineFilter


def test_strips_notify_and_collects():
    f = NotifyLineFilter()
    out = ""
    out += f.feed("Hey there\n")
    out += f.feed('NOTIFY: {"title": "Beer", "body": "buy beer", "severity": "chaos"}\n')
    out += f.feed("more text")
    out += f.flush()

    assert "Beer" not in out
    assert "Hey there" in out
    assert "more text" in out
    assert len(f.notifications) == 1
    assert f.notifications[0].title == "Beer"
    assert f.notifications[0].severity == "chaos"


def test_notify_split_across_chunks():
    f = NotifyLineFilter()
    out = f.feed('NOTIFY: {"title": "A", ')
    out += f.feed('"body": "b"}\n')
    out += f.flush()
    assert out == ""
    assert len(f.notifications) == 1
    assert f.notifications[0].title == "A"
    assert f.notifications[0].severity == "info"  # defaulted


def test_ignores_bad_notify_json():
    f = NotifyLineFilter()
    f.feed("NOTIFY: not json\n")
    f.flush()
    assert f.notifications == []
