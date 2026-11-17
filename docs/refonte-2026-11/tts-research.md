**TTS for Neiji guided meditation — report, 17 Nov 2026**

**Current state in the repo (branch `refresh-2026-11`)**
- `/Users/emericyeou/dev/neiji-landing-webapp/src/lib/meditation/generate-paragraph-audio.ts:106` uses `eleven_turbo_v2_5`, which ElevenLabs lists as deprecated in favour of `eleven_flash_v2_5` (no removal date given). https://elevenlabs.io/docs/overview/models
- Line 107 of the same file requests `mp3_44100_192`. The pricing page ties 192 kbps only to Pro ($99), so this format may fail on a cheaper plan; not tested. https://elevenlabs.io/pricing
- `/Users/emericyeou/dev/neiji-landing-webapp/src/lib/meditation/generate-paragraph-audio-openai.ts:86` uses `tts-1`. OpenAI shuts down `tts-1`, `tts-1-hd` and `gpt-4o-mini-tts` on 6 Jan 2027. https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create
- Silences are already assembled by ffmpeg via `silenceAfter` (`/Users/emericyeou/dev/neiji-landing-webapp/assembly-service/lib/ffmpeg-wrapper.js:48-52`).

**The 402 (reproduced live)**
- The account is `tier: free`, 0 of 10,000 characters used (`GET /v1/user/subscription`).
- `POST /v1/text-to-speech/rAmra0SCIYOxYmRNDSm3` returns 402 with code `paid_plan_required`: "Free users cannot use library voices via the API."
- The docs say the same: "The voice library is not available via the API to free tier users." https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- **Cheapest fix:** Starter, $6/month ($1 the first month), which also adds the commercial licence. https://elevenlabs.io/pricing
- **Pay-as-you-go:** it exists without a subscription. It is prepaid, minimum top-up $5, credits expire after 12 months, and it is available on the free plan. https://elevenlabs.io/docs/overview/administration/pay-as-you-go
- The same page says API access tiers "come from the subscription plan, not the balance". So a top-up alone probably does not unlock library voices or commercial rights; I could not verify this.
- I did not test whether a default (non-library) voice works on the free tier.

**Candidates** (cost is for 2,700 characters, about 5 minutes)

| Model id | Price | 5 min cost | Max input | Pauses and pacing | French |
|---|---|---|---|---|---|
| `eleven_v4` | $0.08/1k | $0.22 | 10,000 chars (~10 min) | No SSML break; audio tags, ellipses | Yes |
| `eleven_v4_turbo`, `eleven_flash_v2_5` | $0.04/1k | $0.11 | Flash 40,000; v4 Turbo not listed | Flash: not stated; v4 Turbo: audio tags | Yes |
| `eleven_multilingual_v2` | $0.08/1k | $0.22 | 10,000 chars | `<break>` up to 3 s (unstable if many); speed 0.7–1.2 | Yes |
| `eleven_v3` | $0.08/1k | $0.22 | 5,000 chars | No break tags | Yes |
| `gemini-3.8-flash-tts` | $0.00225 per 10 s of audio | ≤ $0.07 | Not stated | `style` prompt ("speaking slowly"), `<short pause>`, `<long pause>`, `<sigh>` | Yes |
| `sonic-3.6-2026-08-27` (Cartesia) | about $0.05/1k | $0.14 | Not found | `<break time>`, `<speed ratio>` 0.6–1.5 | Yes |
| `gpt-4o-mini-tts` | $12 per 1M audio tokens | Not computable from the page | 4,096 chars | `instructions`; no pause control documented | Yes, "optimized for English" |
| `tts-1-hd` | $30/1M chars | $0.08 | 4,096 chars | `speed` only | Yes |
| Hume Octave 2 | $0.05–0.08/1k (third-party only) | $0.14–0.21 | 5,000 chars per utterance | `speed`, `trailing_silence` | Yes (preview) |
| Azure Neural HD | $22/1M chars (third-party only) | $0.06 | Not checked | Not checked | Not checked |

Sources and caveats per provider:
- **ElevenLabs:** per-character rates are the same on every plan. https://elevenlabs.io/pricing/api ; pause behaviour from https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices. Starter's included quota is unclear: one page says 30k credits, the other implies about 75k characters.
- **Gemini:** the price doubles on 1 Jan 2027. There is a free tier, but its content may be used to improve Google's products; the paid tier is usage-based with no subscription. https://aistudio.google.com/docs/pricing ; https://aistudio.google.com/docs/speech-generation
- **Cartesia:** Pro is $5/month for 100K credits (1 credit per character). The commercial licence starts at Pro, and no subscription-free option is mentioned. Breaks "split the generation". https://cartesia.ai/pricing ; https://docs.cartesia.ai/build-with-cartesia/sonic-3/ssml-tags
- **OpenAI:** usage-based, no subscription. The named migration target is `gpt-realtime-2.1-mini` on the Realtime API. https://developers.openai.com/api/docs/pricing
- **Hume:** the official pricing page gave nothing usable; figures come from a search summary of Hume docs and aggregators.
- **Azure:** the official page masks its prices. https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/

**Quality ranking**
Artificial Analysis leaderboard, blind listener Elo, fetched 17 Nov 2026 (no update date on the page): https://artificialanalysis.ai/text-to-speech/leaderboard

| Rank | Model | Elo |
|---|---|---|
| 1 | Eleven v4 Turbo | 1340 |
| 2 | Eleven v4 | 1338 |
| 3 | Qwen-Audio-3.1-TTS-Plus | 1298 |
| 4 | Sonic 3.6 | 1295 |
| 5 | Simba 3.5 (Speechify) | 1291 |
| 6 | Gemini 3.8 Flash TTS | 1283 |
| 7 | Fish Audio Drama 3 | 1279 |

Ranks 1–2 are statistically tied. OpenAI, Hume and Azure are not in the top 15. The ranking covers general speech, not meditation.

**One request or segments?**
Keep segments plus ffmpeg silence. No provider documents reliable silences beyond about 3 s inside one request. ElevenLabs warns that many break tags cause instability, and v4/v3 have no break tags at all. The existing pipeline already gives exact silences.

**Shortlist**
1. **ElevenLabs `eleven_v4`** on Starter, with a Voice Library meditation voice. Compare against `eleven_multilingual_v2` (speed 0.7–1.2, break tags) and `eleven_v4_turbo` (half the price, tied Elo).
2. **Google `gemini-3.8-flash-tts`**: the cheapest, true pay-as-you-go, with a slow/warm style prompt and pause tags.
3. **Cartesia `sonic-3.6`**: explicit speed and break control, $5 entry plan.

**Recommended primary:** ElevenLabs `eleven_v4`. It tops the blind ranking, has the largest catalogue of meditation-style voices, and the integration already exists: change the model id, check the output format, and move to Starter at $6.

**Recommended fallback:** Gemini 3.8 Flash TTS, replacing the OpenAI fallback, since all three OpenAI speech models shut down on 6 Jan 2027.

**Not verified**
- Latency for long requests, for any provider.
- Whether a pay-as-you-go top-up alone lifts the library-voice restriction.
- The exact plan needed for 192 kbps output.
- Hume and Azure official prices.
- `gpt-4o-mini-tts` cost per minute.
- The v4 prompting guide and its audio tags (the page returned 403).

**Only a listening test can settle**
- Which voice (library or designed) actually sounds calm and warm, and whether its French is native rather than accented.
- v4 versus multilingual v2 on slow pacing, and consistency of tone between segments.
- Whether speed 0.7–0.8 degrades the voice.
- Whether breath sounds read as natural or as artefacts.
- Whether the Gemini "speaking slowly" style holds across 30 or more segments.
- The audible difference between 128 and 192 kbps under a background sound.
