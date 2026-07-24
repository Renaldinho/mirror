"""Runtime configuration.

Everything the deployment might want to change lives here and is overridable via
environment variables (or a local .env file). The model is intentionally a plain
string so you can swap `qwen2.5:7b` for a smaller Qwen or a Hugging Face GGUF
import without touching code.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    # --- Ollama / model ---
    ollama_host: str = "http://localhost:11434"
    # Swap freely: "qwen2.5:7b", "qwen2.5:3b", "qwen3:8b", "hf.co/<repo>:<quant>", ...
    ollama_model: str = "qwen2.5:7b"
    # Set false for models with weak/no native tool-calling -> use the NOTIFY: fallback.
    ollama_supports_tools: bool = True

    # --- Proactive scheduler ---
    proactive_enabled: bool = True
    proactive_interval_seconds: int = 900  # how often Peter bugs you unprompted

    # --- Server ---
    cors_origins: str = "*"  # comma-separated; the Angular dev origin in prod


settings = Settings()
