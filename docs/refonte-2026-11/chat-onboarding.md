**Scope note:** this step maps the chat and specifies onboarding. It does not address the relayed request about TTS voice quality. Nothing was modified, and no browser or dev server was used, so everything below comes from reading the code. Paths are relative to `/Users/emericyeou/dev/neiji-landing-webapp/src`.

## 1. Live and dead components
Both pages render only `ChatPage` (`app/(landing)/chat/page.tsx:1`, `app/protected/chat/page.tsx:1`).

- **Live:** `ChatPage.tsx:7-12` imports `bot-message`, `chat`, `enhanced-chat-input`, `gradient-background`, `user-message`, `unified-provider`. `enhanced-chat-input.tsx:8-12` adds `enhanced-drawer`, `meditation-drawer` (desktop), `swipeable-meditation-panel` (below 768 px, `:81`, `:323-340`) and `meditation-panel`. `bot-message.tsx:8-9` adds `enhanced-audio-player-with-noise` (which imports `background-noise-drawer`, `:17`) and `meditation-loading`.
- **Dead (no importer found by grep):** `chat-input.tsx`, `custom-drawer.tsx` (imported only by `chat-input.tsx:9`), `custom-drawer-clean.tsx`, `enhanced-audio-player.tsx`, `authenticated-provider.tsx`, `base-provider.tsx` (imported only by `authenticated-provider.tsx:6`).
- **TODO.md is stale:** lines 18 and 34 point at the dead `chat-input.tsx`.
- **Questionnaire:** 15 questions. Chat never routes to it; only the profile page does (`app/protected/profile/page.tsx:121,134,146,172`). Login goes straight to `/protected/chat` (`auth/_components/auth-chat.tsx:194,231`).

## 2. Mechanisms
- **Text message:** `unified-provider.tsx:163-279` is a hand-written fetch to `/api/chat`, with no `useChat`. It keeps only stream lines starting with `0:` (`:225`) and drops everything else.
- **Meditation request:** there are two paths, both POST `/api/meditation` and read the body as a blob.
  - Panel button: `enhanced-chat-input.tsx:138-209`.
  - Typed text in meditation mode: `:211-309`, with hard-coded 5 min, female, calm (`:242-250`); the switch is at `:311`.
- **Custom messages:** `addCustomMessage` inserts a user line and a `loading-<ts>` message with `isGeneratingMeditation` (`:142-156`). `updateCustomMessage` turns it into the audio message (`:184-189`). `ChatPage.tsx:46-66` merges the two lists by the 13-digit timestamp in the id.
- **`userinput` annotation:** it is not rendered anywhere today. The route writes it (`api/chat/route.ts:48`), but the provider discards it and `bot-message.tsx` has no annotation code. A grep for "annotation" in `src` matches only `route.ts`. `SelectInput` (`route.ts:21-24`) is unused, because `:28` sets the parameters to `EmailInput` alone.

## 3. Panel problems
- **Panel only visible after submit:** I could not reproduce this from code. The brain button sets the mode directly (`enhanced-chat-input.tsx:64-76`). The only gate is a double `requestAnimationFrame` before height and opacity change (`swipeable-meditation-panel.tsx:39-44`), which does not fire in a tab that is not painting. Unverified.
- **Covers the breathing animation:** the typed-prompt path never calls `setMeditationMode("chat")`. Only the panel's own button closes it (`meditation-panel.tsx:155-161`). The panel is fixed, 310 px high, z-40 (`swipeable-meditation-panel.tsx:135,153`), while the list reserves only `pb-40`, 160 px (`ChatPage.tsx:77`). The loading bubble is also `w-[360px]` (`bot-message.tsx:116`), wider than the 343 px available at 375 px.
- **Covers play:** same open panel. In addition, the scroll effect depends only on `allMessages.length` and `status` (`ChatPage.tsx:70-73`). It does not rerun when the loading message gains `audioUrl`, or when the player appears 600 ms later (`bot-message.tsx:84-86`).

## 4. Specification
- **`unified-provider.tsx`**
  - Move `getVoiceId`, `generatePrompt`, the cancel handler and `handleMeditationGenerate` from `enhanced-chat-input.tsx:103-209` into the provider as `generateMeditation(params)`. Its first statement is `setMeditationMode("chat")`.
  - Add `onboarding` state: `{step: "goal"|"duration"|"voice"|"done", params}`, seeded with the defaults at `meditation-panel.tsx:120-126`.
  - Parse `8:` annotation lines into the assistant message.
- **`bot-message.tsx`**
  - Add `choices?: {label, value, isDefault?}[]`, `onChoose` and `stage?` to `ExtendedMessage`.
  - Render choices under the bubble as rounded orange-outline buttons, 44 px high, default one filled, plus a text button "Skip". After a tap they are disabled and the answer is added as a user message.
  - Change the loading bubble to `w-full max-w-[360px]`.
- **`ChatPage.tsx`**
  - Replace `:81-83` with "A guided meditation made for you, ready in about a minute." and four chips: Sleep, Focus, Calm, Morning. Below them: "Or tell me how you feel."
  - Delete the focus greeting (`:103-112`); it removes the empty state on focus.
  - A chip sets the goal, then two custom assistant messages follow:
    - "How long do you have?" with 3 min, 5 min (default), 10 min.
    - "Which voice do you prefer?" with Female (default), Male.
  - Skip applies the default. After the voice answer, call `generateMeditation`.
  - Add the last message's `audioUrl` to the scroll dependencies and scroll again after 700 ms.
- **`enhanced-chat-input.tsx`**
  - Use the provider function, and call `setMeditationMode("chat")` at the start of `:211`.
  - Replace the user line at `:144` with "A 5 minute meditation for sleep, female voice."
- **`meditation-loading.tsx`**
  - Take a `stage` prop: "Writing your script", then after 15 s "Recording the voice", then "Mixing the audio" when `fetch` resolves, which is the only real signal.
  - Fixed line: "This usually takes 60 to 90 seconds. You can breathe with the circle."
  - The route returns one audio body (`api/meditation/route.ts:196-218`), so the first two stages are timed. I did not verify at what point the response headers are sent.
- **`api/chat/route.ts:28`:** use `z.union([EmailInput, SelectInput])` so the model can offer the same chips.
- **`meditation-panel.tsx`:** remove the "Quick Test" button (`:483-504`) and the sparkle emoji.

## 5. System prompt outline (`api/chat/prompts.ts`, replacing lines 10-13)
1. Identity: "You are Neiji, a calm guide who helps people build a short daily meditation habit."
2. What Neiji is, for when asked: the seven ideas from `app/(landing)/_data/manifestoItems.ts:11-53` in one sentence each (calm as the base of performance, small steps, low friction, habits outlast motivation, the story told as a manga, science as the standard, an ambition larger than an app).
3. Behaviour: when the user describes a feeling, acknowledge it in one sentence, then offer a meditation by calling `userinput` with type `select` and two or three choices.
4. Style: short plain sentences, at most two short paragraphs, no emoji, no exclamation marks.
5. Limits: no medical advice; suggest a professional for health concerns; mention crisis lines if the user is in danger.
6. Remove the newsletter goal.
