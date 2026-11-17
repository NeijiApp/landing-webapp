**Neiji meditation pipeline: map and target architecture**

Root: `/Users/emericyeou/dev/neiji-landing-webapp` (branch `refresh-2026-11`). `M/` = `src/lib/meditation/`. No file in the repo was modified. I ran two plan-only probes from the scratchpad (LLM calls only, no TTS); the live run's prompt and logs were not available.

**1. Call sequence (everything is sequential)**
1. Railway health check, 8 s timeout, which runs `ffmpeg -version` (`src/app/api/meditation/route.ts:29-48`, `assembly-service/serveur-assemblage.js:46`).
2. Parameter parser, one OpenRouter call (`route.ts:92`, `M/llm-parameter-parser.ts:117`).
3. Architect: one `generateText` per section in a `for … await` loop, 4 sections at ≤5 min, 5 at 6–15, 8 above (`M/meditation-architect.ts:146-190, 211-227, 295`). These could run concurrently or as one call.
4. A regex inserts `[PAUSE:n]` after every sentence (`M/intelligent-pause-agent.ts:158-163`).
5. TTS per sentence in a nested `for … await` (`M/generate-concatenated-meditation.ts:34-69`). My probe gave 30 TTS calls for both a 3 min and a 5 min plan.
6. Each TTS call does: cache lookup, ElevenLabs POST, then on failure a second cache lookup, OpenAI `tts-1`, `listBuckets`, Supabase upload and DB insert (`M/generate-paragraph-audio.ts:46, 96`; `M/generate-paragraph-audio-openai.ts:43, 85, 112, 124, 131`). That is about 7 round trips per sentence, so roughly 3 s × 30 ≈ the 95 s observed. All of it could run concurrently.
7. Segments go to Railway as base64 JSON, then a second fetch downloads the result (`generate-concatenated-meditation.ts:139-190`).

**2. Hard-coded ids and prompts**
- **LLM:** `openai/gpt-4o-mini` (`llm-parameter-parser.ts:21`) and `gpt-4o-mini` (`meditation-architect.ts:296`). The architect bypasses `GENERATION_MODEL = "gpt-6.1-terra"` (`src/lib/ai/openai.ts:7`).
- **TTS:** `eleven_turbo_v2_5` at `mp3_44100_192` (`generate-paragraph-audio.ts:106-107`); `tts-1`, speed 0.9, voices `nova`/`onyx` (`generate-paragraph-audio-openai.ts:22-25, 86, 96`).
- **Voices:** `rAmra0SCIYOxYmRNDSm3` (female) and `GUDYcgRAONiI1nXDcNQQ` (male) at `route.ts:13, 191-192`, plus `tts-router.ts:26` and three client components. `VOICE_MAPPING` holds a different male id, `pNInz6obpgDQGcFmaJgB` (`generate-paragraph-audio-openai.ts:23`).
- **Embeddings:** `text-embedding-3-small` (`M/embeddings-service.ts:11`).
- **Prompts:** `llm-parameter-parser.ts:29-112` (lines 96-108 are stray pause examples) and `meditation-architect.ts:342-413`. `M/config.ts` is imported nowhere.
- **Provider order:** `new TTSRouter("elevenlabs", "openai")` at `tts-router.ts:191`; the env var `TTS_PROVIDER` is never read by the router.

**3. Why a "5 minute" request gave 2:43**
Nothing measures audio. Duration is word-count arithmetic at an assumed 140 wpm (`M/meditation-specification.ts:128`), and the `X-Meditation-Duration` header is simply `minutes × 60` (`meditation-architect.ts:71`). Three defects in code:
- **The parser overrides the explicit duration.** Its prompt tells it to infer one (`llm-parameter-parser.ts:40-47`), and the merge applies it when confidence > 0.6 (`:196-199`). In my probe with body duration 5, "quick break to refocus" became 3 and "help me relax" became 10, at confidence 0.9, with all six parameters overridden.
- **Timing adjustment only ever removes silence.** Variance is an absolute value (`M/meditation-timing-calculator.ts:226`) and is always subtracted (`meditation-architect.ts:544-548`). The validator also adds a guessed 2 s per sentence (`timing-calculator.ts:278-280`), so it always "overshoots" by 80–87 s and cuts.
- **A section's last pause is overwritten, not added** (`generate-concatenated-meditation.ts:90, 100`).

Probe results: a 3 min plan is 196 words plus 89 s of silence, about 2:45–2:55. A 5 min plan is about 250 words plus 165 s, about 4:15–4:30. So 2:43 matches a parser override to 3 minutes; I could not confirm this without the live prompt or the `X-Final-Params` header.

One more bug: pauses can be fractional (`intelligent-pause-agent.ts:213`) but every regex is `\d+` (`M/text-processing.ts:29, 68`). Expert, sleep and focus requests would have `[PAUSE:2.5]` sent to the TTS as text.

**4. Cache**
- **What:** one MP3 per sentence in the public Supabase bucket `audio-segments` (`M/audio-storage.ts:19, 40`) and one row in `audioSegmentsCache`.
- **Key:** sha256 of the trimmed, lowercased text, plus `voiceId` and `voiceStyle`, with a per-instance Map in front (`M/cache-management-compatible.ts:33, 44-52`).
- **Hit rate:** text written at temperature 0.7 (`meditation-architect.ts:299`) will essentially never repeat; only the fallback templates (`:525-532`) could. The cache is pure cost: two lookups and three writes per sentence.
- **Poisoning:** OpenAI audio is stored under the ElevenLabs voice id (`generate-paragraph-audio-openai.ts:126, 133`).
- **Dead code:** `M/audio-cache.ts:51-77` and `159-230` are unreachable.

**5. Railway service**
- **What it does:** decodes base64, pads silence with `apad`, concatenates, applies `loudnorm`, and re-encodes to 320 kbps stereo 44.1 kHz (`assembly-service/lib/ffmpeg-wrapper.js:53, 62, 66, 110-113`; `serveur-assemblage.js:131`).
- **Background sound:** it is not mixed there; `background` never reaches assembly (`route.ts:196-201`).
- **Payload up:** about 2–3 MB of JSON for 5 minutes (my estimate; I did not measure the TTS bitrate). The limit is 50 MB (`serveur-assemblage.js:15`).
- **Payload down:** about 2.4 MB per minute, so roughly 6.5 MB for 2:43 and 72 MB for 30 minutes, relayed through Vercel.
- **Removable:** silence plus concatenation can be done in the function on PCM or MP3 frames, with no ffmpeg.
- **Open endpoint:** the service has CORS open and no auth; `ASSEMBLY_API_KEY` is used nowhere outside `src/env.js`.

**6. Failure modes**
- **60 s limit:** `vercel.json:4` sets `maxDuration` 60 and the route exports none. Sequential TTS alone exceeds it, and the assembly fetch has its own 45 s timeout (`generate-concatenated-meditation.ts:168`). The 95 s was local; what the client sees on Vercel is not verified.
- **ElevenLabs retried every sentence:** the router keeps no failure state (`tts-router.ts:87-118`), so each sentence pays a cache lookup and a 402.
- **Silent degradation:** an LLM failure returns a roughly 20-word template with no error (`meditation-architect.ts:311-315`); a parser failure returns confidence 0 (`llm-parameter-parser.ts:151`).
- **Client errors:** 503 with the assembly URL in the body (`route.ts:51-61`); 500 with the raw message (`:223-228`); a Zod failure also returns 500. The client throws the raw body text (`src/components/chat/shared/enhanced-chat-input.tsx:176`).

**7. Target architecture**
One `generateObject` call on `generationModel()` returns `{title, segments:[{text, pauseAfterSec}]}`. The request body's duration is authoritative. Segments are paragraphs of 2–4 sentences, about 10–14 per 5 minutes. The server computes the word budget, measures real audio duration after TTS, and scales pauses to hit the target exactly. One TTS provider, chosen by env, with concurrency 5 and one retry. Audio is requested as PCM, joined with zero-filled silence in memory, encoded once, uploaded to a private Supabase bucket, and returned as a signed URL. Progress goes over SSE (`script`, `tts i/n`, `done {url, durationSec}`). No Railway, no sentence cache.

Not verified: which TTS has the best meditation voice. That needs a listening comparison on a fixed script, and ElevenLabs currently returns 402.

Order of work, each step testable on its own:
1. Honour the explicit duration and fix the timing sign bug. Test: the plan total is within 5 % of the target.
2. Replace the architect with one structured call. Test: schema snapshot.
3. Single provider and concurrency 5 in `generate-concatenated-meditation.ts`, with the cache removed. Test: under 25 s for 5 minutes.
4. Measure duration and scale pauses. Test: `ffprobe` within ±3 s.
5. In-function assembly behind a flag. Test: A/B against Railway.
6. SSE plus storage, and update the two chat inputs.
7. Delete.

- **Change:** `route.ts`, `generate-concatenated-meditation.ts`, `tts-router.ts`, `generate-paragraph-audio-openai.ts`, `audio-storage.ts`, `vercel.json`, `src/env.js`, `enhanced-chat-input.tsx`, `chat-input.tsx`, `meditation-panel.tsx`.
- **Delete:**
  - `M/` core: `meditation-architect`, `llm-parameter-parser`, `intelligent-pause-agent`, `meditation-timing-calculator`, `meditation-specification`, `text-processing`.
  - `M/` cache: `audio-cache`, `cache-management*`, `embeddings-service`.
  - `M/` unused, with no importer on the live path: `ai-agent`, `contextual-agent`, `simple-dynamic-agent`, `ai-metrics`, `pipeline-monitor`, `optimized-segments`, `generate-content`, `generate-silence-mp3`, `parse-text-content`, `inject-data-to-system-prompt`, `schema`, `config`.
  - `src/lib/assembly/*` (no importer) and `assembly-service/`.
  - The `src/app/api/cache/*`, `debug-*` and `test-*` routes.
