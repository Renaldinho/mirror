# mirror-agent — Peter Griffin on your desk

A small distributed app: an **Angular frontend** (meant for a Raspberry Pi 4 kiosk)
talks over **WebSocket** to a **FastAPI backend** that runs a **local LLM via Ollama**
role-playing **Peter Griffin**. Peter chats back and forth and raises **notifications** the
UI collects — both **reactively** (a tool call mid-chat) and **proactively** (a scheduler
makes him bug you unprompted).

The agent layer uses **Microsoft Semantic Kernel**: tools are plain Python methods
decorated with `@kernel_function`, and SK's auto function-calling runs the
call → execute → feed-result-back loop. The model is **swappable via one env var**.

```
Pi 4 (Angular)  <--WebSocket-->  Host (FastAPI + Semantic Kernel)  --HTTP-->  Ollama (Qwen)
```

## Layout
- `backend/` — FastAPI + Semantic Kernel + Ollama. Pydantic schemas are the single source
  of truth for the shared data model.
- `frontend/` — Angular. Types are generated from the backend schema (no drift).

## Prerequisites
- [Ollama](https://ollama.com) running on the backend host.
- Python 3.11+ and Node 20+.

## Backend
```bash
cd backend
python -m venv .venv
./.venv/Scripts/python -m pip install -r requirements.txt   # (Windows Git Bash)
# macOS/Linux: source .venv/bin/activate && pip install -r requirements.txt

cp .env.example .env            # optional; defaults are fine
ollama pull qwen2.5:7b          # the default model (strong tool-calling)

# export the shared schema for the frontend
python -m scripts.export_schema

# run
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Swapping the model
Everything is config-driven (`backend/.env` or env vars):
- `OLLAMA_MODEL` — e.g. `qwen2.5:7b`, `qwen2.5:3b`, `qwen3:8b`, `hf.co/<repo>:<quant>`.
- `OLLAMA_SUPPORTS_TOOLS` — set `false` for models with weak/no native tool-calling; the
  agent then uses a `NOTIFY: {json}` convention (parsed server-side) to raise the same
  notifications. Same UI contract, no tool support required.
- `PROACTIVE_ENABLED` / `PROACTIVE_INTERVAL_SECONDS` — the unprompted-Peter scheduler.

### Tests
```bash
cd backend
./.venv/Scripts/python -m pytest -q
```

## Frontend
```bash
cd frontend
npm install
npm run gen:types      # backend/schema/ws-events.schema.json -> src/app/generated/model.ts
npm start              # ng serve on http://localhost:4200
```
If the Pi points at a remote backend, set `window.__PETER_WS__ = "ws://<host>:8000/ws"` in
`src/index.html` (defaults to `ws://localhost:8000/ws`).

## Shared data model
`backend/app/schemas.py` (Pydantic) defines `ChatMessage`, `Notification`, the WS event
union, and the tool input. Change a field there, rerun `export_schema` + `gen:types`, and
the Angular compiler flags every stale usage — one definition, three consumers (backend
validation, agent tool schema, frontend types).

## How the agent works
- **Persona** — `backend/app/agent/persona.py` (Peter's voice + a comedic boundary).
- **Tools** — `backend/app/agent/plugins.py`: `create_notification` (action) and `get_time`
  (data-fetch), both `@kernel_function` methods. Add more the same way.
- **Loop** — `backend/app/agent/service.py`: SK + Ollama, streaming, auto function-calling.
- **Notifications** — the `create_notification` tool calls `notifications/service.py`, which
  validates and pushes a `notification` WS event to the right client (targeted via a
  contextvar during a chat turn; broadcast for proactive runs).

## Verify end-to-end
1. Ollama up + model pulled; backend and frontend running.
2. **Chat** — type a message; Peter's reply streams in token-by-token.
3. **Reactive notification** — ask Peter to remind you of something; a notification appears
   in the tray (validated against `Notification`).
4. **Proactive notification** — set `PROACTIVE_INTERVAL_SECONDS=60`, restart; an unprompted
   notification appears with no chat activity.
5. **Model swap** — change `OLLAMA_MODEL`; if it lacks tools set `OLLAMA_SUPPORTS_TOOLS=false`
   and confirm the `NOTIFY:` fallback still fills the tray.
6. **Shared-model check** — add a field in `schemas.py`, rerun codegen; the frontend won't
   compile until updated.
