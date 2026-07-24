"""The Peter agent: Semantic Kernel + Ollama, with streaming and tool-calling.

`stream_reply` yields display-ready text chunks for the UI. In tool mode, SK's
auto function-calling runs the create_notification / get_time tools for us. In
fallback mode (models without native tools), we strip `NOTIFY:` lines from the
stream and push those notifications ourselves.
"""
from __future__ import annotations

from typing import AsyncIterator

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.ollama import (
    OllamaChatCompletion,
    OllamaChatPromptExecutionSettings,
)
from semantic_kernel.contents import ChatHistory
from semantic_kernel.functions import KernelArguments

from app.agent.fallback import NotifyLineFilter
from app.agent.persona import persona_prompt
from app.agent.plugins import PeterPlugin
from app.config import settings
from app.notifications import service as notifications
from app.schemas import ChatMessage


class PeterAgent:
    def __init__(self) -> None:
        self.service = OllamaChatCompletion(
            ai_model_id=settings.ollama_model,
            host=settings.ollama_host,
        )
        self.kernel = Kernel()
        self.kernel.add_service(self.service)
        self.kernel.add_plugin(PeterPlugin(), plugin_name="peter")

    def _exec_settings(self) -> OllamaChatPromptExecutionSettings:
        s = OllamaChatPromptExecutionSettings()
        if settings.ollama_supports_tools:
            s.function_choice_behavior = FunctionChoiceBehavior.Auto()
        return s

    def _build_history(self, system: str, history: list[ChatMessage], user_text: str) -> ChatHistory:
        chat = ChatHistory(system_message=system)
        for m in history:
            if m.role == "user":
                chat.add_user_message(m.text)
            else:
                chat.add_assistant_message(m.text)
        if user_text:
            chat.add_user_message(user_text)
        return chat

    async def _stream_raw(self, chat: ChatHistory) -> AsyncIterator[str]:
        exec_settings = self._exec_settings()
        async for messages in self.service.get_streaming_chat_message_contents(
            chat_history=chat,
            settings=exec_settings,
            kernel=self.kernel,
            arguments=KernelArguments(),
        ):
            for msg in messages:
                if msg is not None and msg.content:
                    yield str(msg.content)

    async def stream_reply(
        self, history: list[ChatMessage], user_text: str
    ) -> AsyncIterator[str]:
        """Stream Peter's reply. Handles fallback NOTIFY parsing transparently."""
        system = persona_prompt(settings.ollama_supports_tools)
        chat = self._build_history(system, history, user_text)

        if settings.ollama_supports_tools:
            async for chunk in self._stream_raw(chat):
                yield chunk
            return

        # Fallback mode: filter NOTIFY lines out of the visible stream.
        filt = NotifyLineFilter()
        async for chunk in self._stream_raw(chat):
            display = filt.feed(chunk)
            if display:
                yield display
        tail = filt.flush()
        if tail:
            yield tail
        for note in filt.notifications:
            await notifications.push(note)

    async def run_proactive(self, prompt: str) -> None:
        """Run an unprompted turn purely to (maybe) emit notifications.

        Notifications broadcast to all clients because no single connection owns
        this run (the current_conn_id contextvar is unset here).
        """
        async for _ in self.stream_reply(history=[], user_text=prompt):
            pass  # drain to drive tool calls / NOTIFY parsing; text is discarded


# App-wide singleton.
agent = PeterAgent()
