Nine samples are in `/Users/emericyeou/dev/neiji-landing-webapp/voice-samples/` (five OpenAI, four ElevenLabs), and the app's two ElevenLabs voices are confirmed blocked with HTTP 402 on the free tier.

The folder is excluded from git through `.git/info/exclude`, and `git status` shows nothing from it. Nothing was committed, pushed or deployed. The script as given is 298 characters, not about 380; I used it verbatim for every sample.

## Samples

| File | Provider | Model | Voice | HTTP | Duration | Size | Approx. cost | Note |
|---|---|---|---|---|---|---|---|---|
| `openai-gpt-4o-mini-tts-sage.mp3` | OpenAI | gpt-4o-mini-tts | sage | 200 | 25.0 s | 400,128 B | ~0.006 USD | with the `instructions` field |
| `openai-gpt-4o-mini-tts-shimmer.mp3` | OpenAI | gpt-4o-mini-tts | shimmer | 200 | 20.8 s | 332,928 B | ~0.005 USD | with the `instructions` field |
| `openai-gpt-4o-mini-tts-coral.mp3` | OpenAI | gpt-4o-mini-tts | coral | 200 | 22.2 s | 354,432 B | ~0.006 USD | with the `instructions` field |
| `openai-gpt-4o-mini-tts-ash.mp3` | OpenAI | gpt-4o-mini-tts | ash | 200 | 25.0 s | 400,128 B | ~0.006 USD | with the `instructions` field |
| `openai-tts-1-hd-nova.mp3` | OpenAI | tts-1-hd | nova | 200 | 18.2 s | 290,688 B | ~0.009 USD | no instructions (not supported); closest to the current fallback |
| `elevenlabs-eleven_v4-river.mp3` | ElevenLabs | eleven_v4 | River (premade, `SAz9YHcvj6GT2YYXdXww`) | 200 | 20.4 s | 327,305 B | 298 chars of quota expected | default voice settings |
| `elevenlabs-eleven_multilingual_v2-river.mp3` | ElevenLabs | eleven_multilingual_v2 | River (premade) | 200 | 21.9 s | 351,128 B | 298 chars expected | default voice settings |
| `elevenlabs-eleven_v4-sarah.mp3` | ElevenLabs | eleven_v4 | Sarah (premade, `EXAVITQu4vr4xnSDxMaL`) | 200 | 21.8 s | 350,710 B | 298 chars expected | default voice settings |
| `elevenlabs-eleven_v4-male-calm-resonant-generated.mp3` | ElevenLabs | eleven_v4 | "Male calm resonnant voice 1.1" (generated, `0wNZ6hM7uPvBndYl7LNf`) | 200 | 21.6 s | 346,531 B | 298 chars expected | the account's own designed voice; an extra attempt beyond the brief |
| none | ElevenLabs | eleven_turbo_v2_5 | Lana Weiss (`rAmra0SCIYOxYmRNDSm3`) | 402 | n/a | n/a | 0 | app's female voice, on the model the app uses |
| none | ElevenLabs | eleven_turbo_v2_5 | Milo (`GUDYcgRAONiI1nXDcNQQ`) | 402 | n/a | n/a | 0 | app's male voice, same error |

- **Format:** all files are 128 kbps MP3; durations come from ffprobe.
- **OpenAI cost:** about 0.03 USD in total, against the 0.60 budget. This is computed from list prices I recall (gpt-4o-mini-tts about 0.015 USD per minute of audio, tts-1-hd 30 USD per million characters); I did not fetch the pricing page.
- **ElevenLabs quota:** 1,192 characters were successfully generated (about 1,800 submitted including the two 402s), against the 4,000 budget. However, `GET /v1/user/subscription` still returned `character_count: 0 / 10000` after all four successes. I cannot say whether the counter is delayed or these calls were not billed.

## OpenAI: what the key can do

`GET https://api.openai.com/v1/models` returned 200 with 98 models. The speech-relevant ids are:

- **TTS:** `gpt-4o-mini-tts`, `gpt-4o-mini-tts-2025-03-20`, `gpt-4o-mini-tts-2025-12-15`, `tts-1`, `tts-1-1106`, `tts-1-hd`, `tts-1-hd-1106`.
- **Audio and realtime families:** `gpt-audio`, `gpt-audio-1.5`, `gpt-audio-mini`, `gpt-realtime`, `gpt-realtime-1.5`, `gpt-realtime-2`, `gpt-realtime-2.1`, `gpt-realtime-2.1-mini`, `gpt-realtime-mini`; I did not test these.

No TTS id newer than the `gpt-4o-mini-tts-2025-12-15` snapshot appears in the list. All four voices (sage, shimmer, coral, ash) were accepted by the API; I did not fetch the docs voice list.

The current fallback uses `tts-1` with voice `nova` and no instructions: `/Users/emericyeou/dev/neiji-landing-webapp/src/lib/meditation/generate-paragraph-audio-openai.ts:86` (model) and `:22` (mapping of `rAmra0SCIYOxYmRNDSm3` to nova).

## ElevenLabs: exact 402 body

For `POST /v1/text-to-speech/rAmra0SCIYOxYmRNDSm3` with `eleven_turbo_v2_5`:

```
{"detail":{"type":"payment_required","code":"paid_plan_required","message":"Free users cannot use library voices via the API. Please upgrade your subscription to use this voice.","status":"payment_required","request_id":"9642c973519f32012cab6a3c89841504"}}
```

`GUDYcgRAONiI1nXDcNQQ` returns the same body (request_id `f3c114e7fff6d6d0ff5541374e0171ef`).

## ElevenLabs: account state

**Subscription** (`GET /v1/user/subscription`, 200):
- Tier `free`, status `free`, 10,000 characters per month, extension not allowed.
- Voice slots 2 of 3 used; professional voice limit 0.
- `can_use_instant_voice_cloning: false`, `can_use_professional_voice_cloning: false`.
- Next quota reset is unix 1795830028.

**Voices** (`GET /v1/voices`, 200, 42 voices):
- **21 premade:** Roger, Sarah, Laura, Charlie, George, Callum, River, Harry, Liam, Alice, Matilda, Will, Jessica, Eric, Bella, Chris, Brian, Daniel, Lily, Adam, Bill. River is the only one labelled "calm".
- **19 professional (library voices added to the account):** these include both app voices, Lana Weiss – Meditation (`rAmra0SCIYOxYmRNDSm3`) and Milo – Calm, Soothing, Meditative (`GUDYcgRAONiI1nXDcNQQ`). The others are Brittney, Cal, Drew, Leoni Vergara, Lucian, Hope, JM, Natasha's Gentle Meditation, Jen, Jerry B., Natasha's Husband, Theo Hartwell, Viraj, Jack Bass, Kaine Stromberg, Jessica Anne Bogart and Shannon.
- **1 generated:** "Male calm resonnant voice 1.1" (`0wNZ6hM7uPvBndYl7LNf`).
- **1 cloned:** "Nina" (`Y7VRxDjbjqS9SuubMLEm`).

**Models** (`GET /v1/models`, 200):
- TTS-capable: `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_v3_conversational`, `eleven_multilingual_v2`, `eleven_flash_v2_5`, `eleven_turbo_v2_5`, `eleven_turbo_v2`, `eleven_flash_v2`.
- Speech-to-speech only: `eleven_english_sts_v2`, `eleven_multilingual_sts_v2`.
- None requires alpha access. Cost multiplier is 1.0 for v4, v3 and multilingual_v2, and 0.5 for the turbo, flash and v3_conversational models.

## What the ElevenLabs account can and cannot do today

- **Can:** generate through the API with premade voices on `eleven_v4` and `eleven_multilingual_v2`, and with its own generated voice on `eleven_v4`. All three paths returned 200.
- **Cannot:** use any library ("professional") voice through the API. That covers both voice ids hard-coded in the app (`src/app/api/meditation/route.ts:13` and `:191-192`, `src/lib/meditation/tts-router.ts:26`), called with `eleven_turbo_v2_5` at `src/lib/meditation/generate-paragraph-audio.ts:106`. A paid plan is required; the voices' `free_users_allowed: true` flag does not lift the API restriction.
- **Ceiling:** 10,000 characters a month, not extendable, with voice cloning disabled.

## Not verified

- I tested 402 only on the two app voices; the other 17 library voices are assumed to behave the same.
- The cloned voice "Nina" was not tested.
- `eleven_v3`, `eleven_v4_turbo` and the flash/turbo models were not tested with premade voices.
- ElevenLabs samples use default voice settings, not the app's `voice_settings`, `next_text` or 192 kbps output.
- Which paid tier unlocks library voices over the API is not stated in the error and I did not look it up.
- All samples are in English; no French sample was generated.
