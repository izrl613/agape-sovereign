# Gemma-4-E4B-MLX Integration — Agape Sovereign

## Goal
Replace all cloud Gemini API calls in the Agape Sovereign workspace with the local
Gemma-4-E4B-MLX model running via LMStudio (port 1234), and add a Classic Blue
Model Selector widget to the app header that shows live connection status.

## Files

### [NEW] src/services/localAIService.ts
Central AI adapter. All AI calls go through here.
- `checkLocalAI()` — probe LMStudio port 1234
- `localChatComplete(messages, opts)` — non-streaming (for scanService)
- `localChatStream(messages, onChunk, opts)` — SSE streaming (for ArchitectAI)
- `MODEL_ID = 'gemma-4-e4b-mlx'`, `MODEL_DISPLAY = 'Gemma-4-E4B-MLX'`
- `max_tokens: -1` on every request (unlimited)
- Falls back to Gemini cloud API only if LMStudio is offline

### [MODIFY] src/services/scanService.ts
- Remove top-level `new GoogleGenAI()` instance
- Replace `generateFinding()` → use `localChatComplete` with JSON parsing
- Replace `generateSuspiciousReport()` → use `localChatComplete`

### [MODIFY] src/components/ArchitectAI.tsx
- Remove inline `new GoogleGenAI()` instances in `fetchThreatFeed` and `handleSend`
- Replace `ai.models.generateContentStream()` with `localChatStream()`
- Replace `ai.models.generateContent()` (threat feed) with `localChatComplete()`
- Update system prompt header line to reference Gemma-4-E4B-MLX

### [MODIFY] src/components/Layout.tsx
- Add `ModelSelectorWidget` component (inline, before profile button in Header)
- Shows pulsing Classic Blue `Gemma-4-E4B-MLX` pill when LMStudio online
- Shows amber pill + "Gemini Cloud" when offline/fallback
- Polls `/api/status` on the Antigravity proxy (port 3000) every 10s

### [MODIFY] src/index.css
- Add `@keyframes pulse-classic-blue` animation
- Add `.model-chip-blue` and `.model-chip-offline` CSS classes
