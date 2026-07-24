"""Proactive scheduler: makes Peter bug the user unprompted.

An APScheduler job periodically runs the agent with the proactive prompt. Any
notifications it raises broadcast to all connected clients. We skip the run when
nobody is connected so we don't waste model calls talking to an empty room.
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.agent.persona import PROACTIVE_PROMPT
from app.agent.service import agent
from app.chat.manager import manager
from app.config import settings

log = logging.getLogger("peter.scheduler")

_scheduler: AsyncIOScheduler | None = None


async def _tick() -> None:
    if not manager.connection_ids():
        return  # nobody listening; don't bother the model
    try:
        await agent.run_proactive(PROACTIVE_PROMPT)
    except Exception:  # noqa: BLE001 - never let a scheduled run crash the loop
        log.exception("proactive run failed")


def start() -> None:
    global _scheduler
    if not settings.proactive_enabled or _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _tick,
        "interval",
        seconds=settings.proactive_interval_seconds,
        id="peter_proactive",
    )
    _scheduler.start()
    log.info("proactive scheduler started (every %ss)", settings.proactive_interval_seconds)


def shutdown() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
