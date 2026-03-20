# Mordechaius Maximus — Cursor-Inspired AI Chat

Mordechaius Maximus is a Cursor-style chat interface built into your app: agent selection, voice input, Planning vs Ask mode, and Keep all / Undo all.

## Features

- **Agent selection** — Agent, Chat, or Planning
- **Mode toggle** — Ask (quick answers) or Plan (structured, step-by-step)
- **Microphone** — Voice input via Web Speech API (Chrome, Edge, Safari)
- **Keep all / Undo all** — For suggested changes (placeholder for file-edit backend)
- **Multi-turn chat** — Conversation history, multiple chat sessions
- **Dark Cursor-like UI** — Sidebar, toolbar, message bubbles

## Setup

1. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

2. Get an API key from [OpenAI](https://platform.openai.com/api-keys).

3. Restart the server. Without the key, Mordechaius Maximus runs in demo mode (helpful placeholder message).

## Usage

- **New chat** — Click "+ New chat" in the sidebar
- **Switch chats** — Click a chat in the list
- **Voice input** — Click the mic button, speak, then click again to stop
- **Ask vs Plan** — Toggle changes how Mordechaius Maximus responds (concise vs structured)
- **Agent** — Select Agent, Chat, or Planning (affects system prompt)

## Keep all / Undo all

These buttons appear when the AI returns suggested changes. To enable file edits:

1. Add a backend that accepts change requests
2. Update `/api/mordecai/chat` to return `changes` in the response
3. Wire Keep all to apply changes, Undo all to discard

For now they show status messages.
