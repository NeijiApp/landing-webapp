**Verdict:** the report holds up on nearly every point; one correction changes the migration steps, and the primary and fallback stand.

**(1) Confirmed**

- **Repo:** `eleven_turbo_v2_5` and `mp3_44100_192` at `/Users/emericyeou/dev/neiji-landing-webapp/src/lib/meditation/generate-paragraph-audio.ts:106-107`; `tts-1` at `.../generate-paragraph-audio-openai.ts:86`; `silenceAfter` at `.../assembly-service/lib/ffmpeg-wrapper.js:48-52`.
- **ElevenLabs models:** `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_multilingual_v2` and `eleven_flash_v2_5` exist. Turbo v2.5 is deprecated with no removal date. Limits are 10,000 / 5,000 / 10,000 / 40,000, with v4 Turbo not listed. https://elevenlabs.io/docs/overview/models
- **ElevenLabs prices:** $0.08/1k (v4, v3, multilingual v2) and $0.04/1k (v4 Turbo, Flash), identical in every plan column. That gives $0.216 and $0.108 for 2,700 characters. https://elevenlabs.io/pricing/api
- **402:** reproduced live. Tier is `free`, and the POST returns 402 `paid_plan_required`, "Free users cannot use library voices via the API." The docs sentence matches. https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- **Pay-as-you-go:** prepaid, $5 minimum, 12-month expiry, available on free. Restrictions "come from your subscription plan, not your PAYG balance". https://elevenlabs.io/docs/overview/administration/pay-as-you-go
- **Starter:** $6 a month, $1 the first month, commercial licence included. https://elevenlabs.io/pricing
- **ElevenLabs pauses:** `<break>` up to 3 s, unstable if many; none on v4/v3; speed 0.7–1.2. https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- **OpenAI:** all three models shut down 6 Jan 2027, replacement `gpt-realtime-2.1-mini`; 4,096 characters; `instructions` does not work on `tts-1`/`tts-1-hd`. `tts-1-hd` is $30/1M ($0.081); `gpt-4o-mini-tts` is $12/1M audio tokens with no per-minute figure. https://developers.openai.com/api/docs/deprecations ; https://developers.openai.com/api/docs/pricing
- **Gemini:** `gemini-3.8-flash-tts` costs $0.00225 per 10 s ($0.0675 for 5 min) and doubles on 1 Jan 2027. Free-tier data may be used. `style`, `<short pause>` and `<long pause>` are documented, French is supported, and no input limit is stated. https://aistudio.google.com/docs/pricing ; https://aistudio.google.com/docs/speech-generation
- **Cartesia:** `sonic-3.6-2026-08-27` exists, with French. Pro is $5 for 100K credits at 1 credit per character ($0.135). Speed is 0.6–1.5, and breaks "split the generation". https://docs.cartesia.ai/build-with-cartesia/tts-models/latest ; https://cartesia.ai/pricing
- **Leaderboard:** ranks 1–7 and Elo values match; OpenAI, Hume and Azure sit at ranks 45, 69 and 35. https://artificialanalysis.ai/text-to-speech/leaderboard

**(2) Wrong or unverified**

- **192 kbps (wrong):** the API reference says "MP3 with 192kbps bitrate requires you to be subscribed to Creator tier or above", not Pro. On Starter the current line 107 should be rejected, so switch to `mp3_44100_128` or take Creator. https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- **Usage count (stale):** the account shows 1,192 of 10,000 characters used, not 0.
- **Top-up and library voices (near-certain, not tested):** the free-tier limits remain with a top-up, so a top-up alone will not lift the 402.
- **Cartesia "no subscription-free option" (incomplete):** paid plans have opt-in overages, $65 per 1M credits on Pro.
- **Hume (unverified):** https://www.hume.ai/pricing and https://dev.hume.ai/docs/text-to-speech-tts/overview returned no Octave content.
- **Azure (unverified):** not fetched.
- **"Ranks 1–2 statistically tied" (unverified):** I saw no confidence intervals.
- **"Largest catalogue of meditation voices" (unverified).**
- **Starter quota (unresolved):** 30,000 credits on one page, 75,000 characters on the other.

**(3) Recommendation**

- **Primary stands:** ElevenLabs `eleven_v4`, with the migration being model id, `mp3_44100_128`, and Starter. Test `eleven_v4_turbo` first, since it has the same Elo at half the price.
- **Fallback stands:** `gemini-3.8-flash-tts`. Budget about $0.135 per meditation from January 2027.
