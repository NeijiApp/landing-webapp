# Neiji - TODO

## 🚨 UXR CRITICAL (Before Next Interviews)

### Interview #001 Learnings (Mathis - Jan 2025)
**Status:** Persona invalide (2/5 match) - Had existing solutions that work  
**Key Insight:** Onboarding catastrophique, questionnaire = killer  
**Full synthesis:** See `/docs/INTERVIEW_001_SYNTHESE.md`

### 🔴 BLOCKERS - Fix BEFORE recruiting next participants

- [ ] **CRITICAL: Fix Onboarding Flow**
  - Problem: Users don't know what to do when arriving on chat
  - User quote: "Il sait pas quoi faire en arrivant, gros problème d'onboarding"
  - Solution A: Quick Start with 4 preset buttons (morning/focus/calm/sleep)
  - Solution B: Conversational onboarding with guided steps
  - Files to modify: `src/components/chat/shared/chat-input.tsx`, `src/app/(landing)/chat/page.tsx`
  - **Deadline:** Before Interview #002

- [ ] **CRITICAL: Remove/Postpone Initial Questionnaire**
  - Problem: Too much cognitive load before showing value
  - User quote: "Les questions sont chiantes, personne va le faire comme ça. Il a grave la flemme."
  - Solution: Let users generate 1-2 meditations first, THEN ask personalization questions
  - Alternative: Learn passively from their choices
  - Files to modify: Remove questionnaire flow from chat
  - **Deadline:** Before Interview #002

- [ ] **CRITICAL: Make Meditation Mode Discoverable**
  - Problem: Users can't find the brain button / meditation drawer
  - Observation: "Il essaie de générer sans appuyer sur le mode meditation"
  - Solution: Add tooltip on first load, improve empty state messaging
  - Files to modify: `src/components/chat/shared/chat-input.tsx`, `src/components/chat/shared/meditation-drawer.tsx`
  - **Deadline:** Before Interview #002

### 🟡 HIGH PRIORITY - Improve for better testing

- [ ] **Improve Generation Wait Time Feedback**
  - Problem: 90 sec wait creates anxiety, users don't know what to do
  - Observation: "Il a envie de mettre le son ou d'appuyer en attendant"
  - Solution: Add breathing animation, progress indicator, or mini-exercise during wait
  - Target: Reduce to <30 seconds ideally
  - Files: `src/components/chat/shared/meditation-loading.tsx`

- [ ] **Clarify Landing Page Value Proposition**
  - Problem: Users don't understand what Neiji does in 5 seconds
  - Observation: "Présentation du front page bizarre, il comprend pas trop"
  - Solution: Rewrite hero copy, test "La méditation qui s'adapte à toi, pas l'inverse"
  - Files: `src/app/(landing)/_components/hero.tsx`

### 📊 UXR NEXT STEPS

- [ ] **Recruit 5-7 BETTER Persona Matches**
  - ✅ Has regular stress/anxiety (weekly minimum)
  - ✅ Has tried meditation but couldn't stick with it
  - ✅ Does NOT have effective solutions already
  - ✅ Less "meta" / product-savvy than Mathis
  - See: `/docs/UXR_RECRUITMENT_GUIDE.md`

- [ ] **Prepare for Interview #002-006**
  - [ ] Fix the 3 critical blockers above
  - [ ] Print `/docs/UXR_CHECKLIST_JOUR_J.md`
  - [ ] Setup transcription AI (Otter.ai)
  - [ ] Practice "creuser" technique (5 whys)
  
### 🎯 Hypotheses to Validate (After fixing onboarding)

**From Interview #001:**
- ❌ H1 (Problem exists): Not tested - persona invalide
- ❌ H2 (Solutions insufficient): Not tested - he has effective solutions
- ❓ H3 (Personalization > wait): Not tested - bugs blocked the flow
- 🤔 H4 (Meditation alone): Interesting insight on "meditation as state" vs "formal activity"
- ❓ H5 (Chat > Parameters): Not tested - drawer not accessible
- ❌ H6 (Mascot engages): Invalidated for "meta" users, but need to test with others
- ✅ H7 (Onboarding blocks): VALIDATED - completely lost, questionnaire killer
- ✅ H8 (Evening time): Partially validated - "sas de décompression" concept

**Full framework:** See `/docs/UX_RESEARCH_FRAMEWORK.md`

---

## 🔥 High Priority

### ✅ Google OAuth - FIXED (needs setup)
- [x] Code fixed - redirects work properly now
- [x] **Setup Required**: Add `NEXT_PUBLIC_SITE_URL=https://your-domain.com` to Vercel env vars
- [x] **Setup Required**: Add `https://your-domain.com/auth/callback` to Supabase redirect URLs
- [x] Test in production after setup

### 🐛 Bugs to Fix
- [x] Fix doubled text when creating account/signing in via chat ✅
  - Removed duplicate welcome message
  - Now shows only one message per action
  - Fixed flow from drawer (mode=signup/login works)
  - Fixed redirect to /protected/chat after signup/login (was going back to /auth)
  - Password input secured with dots (already working)
  
- [x] Fix OpenAI chat integration ✅
  - Fixed: `src/components/chat/shared/unified-provider.tsx` - added API call to `/api/chat`
  - The `handleSubmit` function was missing the fetch call to OpenAI API
  - Now properly streams responses from OpenAI and displays them in chat
  - Works on both `/chat` and `/protected/chat` routes
  - System prompt location: `src/app/api/chat/prompts.ts`

### 🎨 Features to Add  
- [ ] Loading animation for meditation generation (1-1.5 min wait)
  - Create breathing circle or progress indicator
  - File: `src/components/chat/shared/meditation-loading.tsx`

- [ ] Mobile: Swipe gesture for meditation panel drawer
  - Add swipe up/down gestures to open/expand/retract meditation panel drawer
  - States: compact → expanded (from chat view)
  - Improve mobile UX with native-feeling drawer interactions

- [x] Add background noises ✅
  - [x] Implemented background noise system with 4 ambient sounds
  - [x] Ocean waves, rain, focus music, and relaxation frequencies
  - [x] Volume control and selection drawer
  - [x] Audio mixing with meditation audio
  - [ ] **Fix background noise on deployed version** - Investigate production issues
  - [ ] **Fix protected chat audio player on deployed version** - Ensure functionality in production
  - [ ] **Fix audio loading bug on deployed mobile and desktop** - Debug production audio issues

- [x] Change female voice to fit naturally
  - Improve voice naturalness and flow
  - Test different voice models and settings

- [ ] Enhance meditation guidance text generation
  - Improve precision based on context
  - Refine prompts and structure for better quality

- [ ] **Business Model: "Flowers" Token System + Stripe Integration**
  
  **💡 Concept:**
  - Virtual currency called "Flowers" (🌸)
  - Each meditation costs flowers based on duration (~1 flower per 10 seconds)
  - Examples: 3min = 18 flowers, 10min = 60 flowers, 20min = 120 flowers
  - New users get X free flowers to start
  - Users can buy flower packs via Stripe
  
  **🎯 Business Model Strategy:**
  - [ ] Define pricing tiers:
    - Freemium: X flowers/month (e.g., 50 flowers = ~8min of meditation)
    - Small pack: €X for Y flowers
    - Medium pack: €X for Y flowers (better value)
    - Large pack: €X for Y flowers (best value)
    - Subscription: €X/month for unlimited or large monthly allowance
  - [ ] Define what happens when out of flowers:
    - Soft paywall with clear value prop
    - "Preview" mode (first 30 sec free?)
    - Limited generic meditations available?
  - [ ] Competitive analysis: Calm (~€60/year), Headspace (~€50/year)
  - [ ] Calculate unit economics (generation cost vs. pricing)
  
  **🎨 UX/UI Design:**
  - [ ] Flower balance display (always visible in header/chat)
  - [ ] Cost preview before generating ("This meditation will cost 60 🌸")
  - [ ] Celebration when receiving flowers (animation, confetti)
  - [ ] Empty state when out of flowers (upgrade CTA)
  - [ ] Purchase flow (modal, smooth, reassuring)
  - [ ] Gift flowers feature (referral program?)
  - [ ] Streak rewards (daily meditation = bonus flowers)
  - [ ] Achievement system (unlock free flowers)
  
  **🔧 Technical Implementation:**
  - [ ] Database schema:
    - `user_credits` table: user_id, flower_balance, last_updated
    - `credit_transactions` table: user_id, amount, type (earned/spent/purchased), meditation_id, timestamp
    - `purchase_history` table: user_id, stripe_payment_id, flowers_purchased, amount_paid, timestamp
  - [ ] API endpoints:
    - GET `/api/user/flowers` - Get current balance
    - POST `/api/meditation/generate` - Check & deduct flowers before generation
    - POST `/api/flowers/purchase` - Stripe checkout session
    - POST `/api/webhooks/stripe` - Handle successful payments
  - [ ] Flower management:
    - Atomic transactions (prevent race conditions)
    - Rollback if meditation generation fails
    - Audit log of all flower transactions
  - [ ] Cost calculation logic:
    - Function: `calculateMeditationCost(duration_seconds)` 
    - Example: `Math.ceil(duration_seconds / 10)` flowers
    - Display cost before user confirms generation
  
  **🔒 Security & Validation:**
  - [ ] Server-side flower balance checks (NEVER trust client)
  - [ ] Rate limiting on flower purchases (prevent fraud)
  - [ ] Validate Stripe webhooks (signature verification)
  - [ ] RLS policies in Supabase (users can only see their own balance)
  - [ ] Prevent negative balances (atomic decrement with check)
  - [ ] Log suspicious activity (rapid purchases, chargebacks)
  
  **💳 Stripe Integration:**
  - [ ] Setup Stripe account + API keys
  - [ ] Create products in Stripe Dashboard:
    - Small Flower Pack
    - Medium Flower Pack  
    - Large Flower Pack
    - Monthly Subscription (if applicable)
  - [ ] Implement Stripe Checkout flow
  - [ ] Handle webhook events:
    - `checkout.session.completed` → Add flowers to user
    - `payment_intent.succeeded` → Confirm transaction
    - `charge.refunded` → Deduct flowers back
  - [ ] Test mode first, then production
  - [ ] Handle errors gracefully (payment failed, etc.)
  
  **📊 Analytics & Monitoring:**
  - [ ] Track conversion rate (free → paid)
  - [ ] Monitor average flowers spent per user
  - [ ] A/B test pricing tiers
  - [ ] Identify optimal free flower amount
  - [ ] Churn analysis (users who run out and don't buy)
  
  **🎁 Growth & Retention:**
  - [ ] Welcome bonus (X flowers on signup)
  - [ ] Daily login reward (small flower amount)
  - [ ] Referral program (both users get flowers)
  - [ ] Seasonal promotions (double flowers, discount packs)
  - [ ] Streak rewards (meditate X days in a row = bonus)
  - [ ] Achievement unlocks (50 meditations = free pack)
  
  **Files to create/modify:**
  - `src/app/api/flowers/*` (flower management endpoints)
  - `src/app/api/stripe/*` (Stripe checkout & webhooks)
  - `src/components/flowers/FlowerBalance.tsx` (display balance)
  - `src/components/flowers/PurchaseModal.tsx` (buy flowers)
  - `src/components/flowers/EmptyState.tsx` (out of flowers)
  - `src/lib/flowers/calculate-cost.ts` (cost logic)
  - `src/lib/stripe/client.ts` (Stripe client)
  - `src/server/db/schema.ts` (add flowers tables)
  - Database migrations for flowers system
  
  **💡 UXR Questions to Validate (in next interviews):**
  - [ ] "Would you pay for personalized meditations? How much?"
  - [ ] "Prefer: subscription (€X/month unlimited) or pay-per-use (buy packs)?"
  - [ ] "Does a 'flower' currency feel playful or childish?"
  - [ ] "How many free meditations before paywall feels right?"
  - [ ] Show pricing tiers: "Which would you choose?"

- [ ] Enhance system prompt
  - Improve AI guidance quality
  - Review and refine prompts in `src/app/api/chat/prompts.ts`

- [ ] Product strategy, UI/UX research, and website wording
  - Define features and user journey
  - Research optimal UX patterns
  - Refine website copy and messaging

- [ ] **RESTRUCTURE: Protected Area - Tabs & Navigation**
  
  **New Structure:**
  ```
  /protected/
    ├── dashboard/     [NEW - Main view]
    ├── profile/       [REWORK - Conversational onboarding]
    └── chat/          [Existing]
  ```

  **🎯 Objectif:** Séparer clairement "utilisation" (dashboard) et "personnalisation" (profile)

---

- [ ] **📊 TAB 1: DASHBOARD (Tableau de bord) - REWORK COMPLET**
  
  **Vision:** Vue d'ensemble de l'expérience utilisateur Neiji
  
  **Sections du Dashboard:**
  
  **1️⃣ Section: Méditations Générées**
  - [ ] **Liste des méditations avec player intégré**
    - Grid/List view des méditations générées
    - Card par méditation avec:
      - Titre généré automatiquement (ex: "Calme du soir - 10 min")
      - Date de création (relative: "Il y a 2 jours")
      - Durée, goal (🌅🎯😌🌙), voice, guidance
      - Thumbnail/visual (couleur selon goal?)
      - Mini player intégré (play/pause inline)
    - Click sur card → Ouvre player fullscreen avec:
      - Waveform audio visualisation
      - Contrôles (play/pause, timeline, volume)
      - Background noise selector
      - Download button
      - Favorite/Bookmark toggle
      - Delete (avec confirmation)
      - Share (future)
  
  - [ ] **Filters & Sort**
    - Filter par goal (all/morning/focus/calm/sleep)
    - Filter par durée (3min/5min/10min/15min/20min)
    - Filter par date (today/this week/this month/all)
    - Sort: Recent first / Oldest first / Most played / Favorites
  
  - [ ] **Empty State**
    - Si aucune méditation générée:
      - Illustration + "Crée ta première méditation personnalisée"
      - CTA vers /protected/chat
  
  **2️⃣ Section: Historique des Conversations**
  - [ ] **Timeline des discussions avec Neiji**
    - Liste chronologique des conversations
    - Groupées par date (Aujourd'hui / Hier / Cette semaine / Plus ancien)
    - Preview de chaque conversation:
      - Premier message de l'user
      - Timestamp
      - Nombre de messages dans la conversation
      - "Continuer la conversation" → Ouvre /protected/chat avec contexte
    - Click → Expand pour voir tous les messages
  
  - [ ] **Search dans l'historique**
    - Recherche par mots-clés dans conversations
    - Highlight des résultats
  
  - [ ] **Actions**
    - Delete conversation (avec confirmation)
    - Export conversation (future)
  
  **3️⃣ Section: Stats & Insights** (Future - Gamification)
  - [ ] **Widgets de statistiques**
    - Total méditations générées (nombre + équivalent en temps)
    - Streak actuel (jours consécutifs)
    - Goal le plus utilisé (chart/pie)
    - Temps total de méditation
    - Flowers dépensés/restants (lié au business model)
  
  - [ ] **Achievements/Badges** (Future)
    - "Première méditation" 🎉
    - "7 jours de suite" 🔥
    - "Zen Master" (50+ méditations) 🧘‍♀️
  
  **4️⃣ Section: Quick Actions**
  - [ ] **Raccourcis**
    - "Générer une méditation" → /protected/chat
    - "Rejouer ma dernière méditation"
    - "Continuer ma conversation"
  
  **🎨 UI/UX Design:**
  - Layout: Sidebar navigation (Dashboard / Profile / Chat)
  - Responsive: Mobile → Bottom nav / Desktop → Left sidebar
  - Theme: Cohérent avec branding Neiji (orange, calme, aéré)
  
  **📦 Files to create/modify:**
  - `src/app/protected/dashboard/page.tsx` (main dashboard)
  - `src/components/dashboard/MeditationsList.tsx`
  - `src/components/dashboard/MeditationCard.tsx`
  - `src/components/dashboard/AudioPlayer.tsx` (fullscreen player)
  - `src/components/dashboard/ConversationHistory.tsx`
  - `src/components/dashboard/StatsWidgets.tsx`
  - `src/app/api/meditations/route.ts` (fetch user's meditations)
  - `src/app/api/conversations/route.ts` (fetch conversation history)
  
  **🗄️ Database Schema:**
  ```sql
  -- Table: meditation_sessions
  CREATE TABLE meditation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    title TEXT, -- Auto-generated or user-edited
    duration_seconds INTEGER NOT NULL,
    goal VARCHAR(50) NOT NULL, -- 'morning', 'focus', 'calm', 'sleep'
    voice_gender VARCHAR(10), -- 'male', 'female'
    guidance_level VARCHAR(20), -- 'beginner', 'confirmed', 'expert'
    background_sound VARCHAR(50), -- 'ocean', 'rain', 'music', 'relax', 'none'
    flowers_spent INTEGER, -- Cost in flowers
    play_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    conversation_id UUID REFERENCES conversations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Table: conversations
  CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL, -- Array of {role, content, timestamp}
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Indexes
  CREATE INDEX idx_meditation_sessions_user ON meditation_sessions(user_id, created_at DESC);
  CREATE INDEX idx_conversations_user ON conversations(user_id, last_message_at DESC);
  ```

---

- [ ] **👤 TAB 2: PROFILE - CONVERSATIONAL ONBOARDING (5 Questions)**
  
  **Vision:** Remplacer le questionnaire statique par une conversation naturelle avec Neiji
  
  **🎯 Objectif:** 
  - Collecter 5 informations clés pour personnaliser le system prompt
  - Rendre ça agréable et conversationnel (pas un formulaire!)
  - Neiji réagit aux réponses avec empathie via ChatGPT
  - Les réponses alimentent la personnalisation des méditations
  
  **🗣️ Format: Conversation Progressive (1 question à la fois)**
  
  **Question 1: Objectif Principal**
  > **Neiji:** "Salut ! 🌸 J'aimerais mieux te connaître pour créer des méditations vraiment adaptées à toi. Pour commencer : qu'est-ce qui t'amène ici ? Qu'est-ce que tu cherches à améliorer dans ta vie ?"
  
  **Options (boutons suggérés + champ libre):**
  - 😰 Gérer mon stress/anxiété
  - 😴 Mieux dormir
  - 🎯 Améliorer ma concentration
  - 🧘 Développer une routine de méditation
  - ✍️ Autre (champ libre)
  
  **User répond:** "Gérer mon stress"
  
  **Neiji réagit (via ChatGPT):**
  > "Je comprends, le stress peut vraiment impacter le quotidien. Tu gères ça depuis longtemps ?"
  
  *[L'user peut répondre librement, Neiji écoute et rebondit naturellement]*
  
  ---
  
  **Question 2: Niveau d'Expérience**
  > **Neiji:** "Est-ce que tu as déjà médité avant ? Ça m'aidera à ajuster le niveau de guidance."
  
  **Options:**
  - 🌱 Débutant complet (jamais essayé ou très peu)
  - 🌿 J'ai déjà essayé quelques fois
  - 🌳 Je médite régulièrement (plusieurs fois par mois)
  - 🧘‍♀️ Pratique avancée (quotidienne ou presque)
  
  **Neiji réagit selon la réponse:**
  - Si débutant: "Parfait ! Je vais te guider pas à pas, sans précipitation."
  - Si avancé: "Super ! Je peux te proposer des méditations plus silencieuses si tu veux."
  
  ---
  
  **Question 3: Moments de la Journée**
  > **Neiji:** "À quel moment de la journée tu imagines méditer le plus souvent ?"
  
  **Options (multi-select possible):**
  - 🌅 Le matin au réveil
  - ☕️ Pendant une pause dans la journée
  - 🌆 En fin d'après-midi
  - 🌙 Le soir avant de dormir
  - 🤷 Ça dépend des jours
  
  **Neiji réagit:**
  > "Le soir c'est un super moment pour décompresser. Je te proposerai des méditations adaptées pour ça."
  
  ---
  
  **Question 4: Durée Préférée**
  > **Neiji:** "Combien de temps tu peux te consacrer pour une méditation, en général ?"
  
  **Options:**
  - ⚡️ Courtes (3-5 min) - Je suis souvent pressé
  - ⏱️ Moyennes (7-10 min) - J'aime prendre mon temps
  - 🕰️ Longues (15-20 min) - Je veux vraiment m'immerger
  - 🎯 Ça varie selon mon humeur
  
  **Neiji réagit:**
  > "5 minutes c'est déjà super ! Même court, ça peut faire une vraie différence."
  
  ---
  
  **Question 5: Voix & Ambiance Préférées**
  > **Neiji:** "Dernière question : qu'est-ce qui t'aide le plus à te détendre ?"
  
  **Options:**
  - 🎙️ Une voix douce qui me guide
  - 🌊 Des sons de nature (océan, pluie...)
  - 🎵 De la musique apaisante
  - 🤫 Du silence avec peu de guidage
  - 🎨 Un mix de tout ça
  
  **User répond:** "Voix douce + sons de nature"
  
  **Neiji conclut:**
  > "Parfait ! J'ai tout noté. Maintenant je pourrai te créer des méditations qui te ressemblent vraiment. 🌸 Prêt à essayer ?"
  
  **[CTA: "Créer ma première méditation"]**
  
  ---
  
  **💾 Stockage des Réponses → System Prompt Personnalisé**
  
  **Database Schema:**
  ```sql
  CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 5 Questions
    main_goal VARCHAR(100), -- 'stress', 'sleep', 'focus', 'routine', 'other'
    main_goal_details TEXT, -- Free text response
    experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'regular', 'advanced'
    preferred_times JSONB, -- ['morning', 'break', 'evening', 'night', 'varies']
    preferred_duration VARCHAR(20), -- 'short', 'medium', 'long', 'varies'
    preferred_ambiance JSONB, -- ['voice', 'nature', 'music', 'silence', 'mix']
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
  
  **Génération du System Prompt Personnalisé:**
  ```typescript
  function generatePersonalizedSystemPrompt(profile: UserProfile): string {
    let prompt = `You are Neiji, a mindfulness companion for ${profile.user_name || 'this user'}.
  
  USER CONTEXT:
  - Main goal: ${profile.main_goal} - ${profile.main_goal_details}
  - Experience level: ${profile.experience_level}
  - Prefers meditating: ${profile.preferred_times.join(', ')}
  - Typical duration: ${profile.preferred_duration} sessions
  - Ambiance preference: ${profile.preferred_ambiance.join(' + ')}
  
  INSTRUCTIONS:
  - Adapt your guidance level to their experience (${profile.experience_level})
  - When suggesting meditations, prioritize their main goal (${profile.main_goal})
  - Suggest durations that fit their preference (${profile.preferred_duration})
  - Be warm, empathetic, and use their name occasionally
  - Remember their previous conversations and build continuity
  `;
    
    return prompt;
  }
  ```
  
  **🎨 UI/UX Implementation:**
  - [ ] **Conversational Interface**
    - Chat-like bubbles (Neiji's messages + user's responses)
    - 1 question at a time (progressive disclosure)
    - Neiji "typing..." animation avant chaque réponse
    - Boutons de réponse rapide + option champ libre
    - Smooth scroll entre questions
  
  - [ ] **ChatGPT Integration for Reactions**
    - API call to `/api/profile/react` (uses ChatGPT)
    - Neiji génère des réponses empathiques selon l'input user
    - Garde le contexte de la conversation (history)
    - Ton: Chaleureux, encourageant, jamais condescendant
  
  - [ ] **Progress Indicator**
    - "Question 1/5" en haut
    - Progress bar visuelle
    - Option "Skip for now" si user veut essayer direct
  
  - [ ] **Édition Ultérieure**
    - User peut revenir modifier ses réponses
    - "Modifier mes préférences" dans le profile
    - Re-déclenche le flow conversationnel
  
  **📦 Files to create/modify:**
  - `src/app/protected/profile/page.tsx` (conversational onboarding)
  - `src/components/profile/ConversationalOnboarding.tsx`
  - `src/components/profile/QuestionStep.tsx`
  - `src/app/api/profile/react/route.ts` (ChatGPT reactions)
  - `src/app/api/profile/save/route.ts` (save responses)
  - `src/lib/profile/generate-system-prompt.ts`
  - `src/server/db/schema.ts` (add user_profiles table)
  
  **🔄 Integration avec Product Strategy:**
  - [ ] **Lien avec UXR Insights**
    - Les questions sont basées sur les learnings des interviews
    - Valider les questions dans les prochains tests users
    - Adapter selon feedback (trop intrusif? pas assez?)
  
  - [ ] **Alignement avec Business Model**
    - Profil complété = unlock bonus flowers (gamification)
    - Meilleure personnalisation = plus de valeur perçue = plus de conversions
  
  - [ ] **KPIs à tracker**
    - % users qui complètent le profil
    - Temps moyen pour compléter
    - Abandon rate (à quelle question?)
    - Impact sur rétention (users avec profil vs sans)

---

- [ ] **🧭 Navigation & Transitions entre Tabs**
  - [ ] Sidebar navigation (desktop) / Bottom nav (mobile)
  - [ ] Active state visuel clair
  - [ ] Smooth transitions entre pages
  - [ ] Breadcrumbs si nécessaire
  - [ ] "Retour au dashboard" depuis n'importe où

- [ ] Protected: Feedback submission capability
  - Add feedback form UI and server API endpoint
  - Link from dashboard and chat views

### 🔒 Security
- [ ] Security audit before launch
  - [ ] Check RLS policies in Supabase
  - [ ] Verify no secrets exposed client-side
  - [ ] Test protected routes work

### ⚙️ Infrastructure
- [ ] Test 1.5 min meditation generation timeout
  - Check Railway timeout settings
  - Add timeout handling in API route

---

---

## 🎯 P2 - Polish & Improvements

### 🔧 Infrastructure
- [ ] Change Supabase domain from `gqofawkftiaasxbhalha.supabase.co` to custom domain
  - Option 1: `neiji.co` (main domain)
  - Option 2: `auth.neiji.co` or `api.neiji.co` (subdomain)
  - Requires: Supabase Pro plan + custom domain setup
  - Docs: https://supabase.com/docs/guides/platform/custom-domains

### 📧 Email & Authentication Features
- [ <>] **Setup email confirmation for production**
  - Enable confirmations in `supabase/config.toml` (line 157)
  - Configure SMTP provider (SendGrid, Resend, or AWS SES)
  - Test confirmation email flow
  - Customize email templates (optional)
  
- [ ] **Prevent duplicate accounts (one email = one account)**
  - Supabase already handles this by default (email is unique)
  - Add better error message when email already exists
  - Consider: Show "Email already registered, want to sign in instead?" message
  
- [ ] **Password Reset flow**
  - Add "Forgot password?" link on login page
  - Create password reset flow via email
  - Use Supabase `resetPasswordForEmail()` API
  - File: Create `src/app/(landing)/auth/reset-password/page.tsx`
  
- [ ] **Change Password feature**
  - Add to user profile page (`/protected/profile`)
  - OR: Add as conversational feature in chat
  - Require current password for verification
  - Use Supabase `updateUser()` API
  - Password validation (min 8 chars, letters + numbers)
  
- [ ] **Email change flow**
  - Allow users to update their email address
  - Send confirmation to both old and new email (double confirm)
  - Use Supabase `updateUser({ email: newEmail })` API

### 🔒 Security Enhancements
- [ ] **Rate limiting on auth endpoints**
  - Already configured in `supabase/config.toml` (lines 130-142)
  - Verify it's working as expected
  - Add user-facing messages when rate limit hit
  
- [ ] **Session management**
  - Add "Sign out from all devices" feature
  - Show active sessions in profile
  - Add session timeout warnings
  
- [ ] **Account deletion**
  - Add "Delete my account" feature (GDPR compliance)
  - Require password confirmation
  - Delete user data from database
  - Handle orphaned data (conversations, meditation history)

### 👤 User Profile Features
- [ ] **Profile completion**
  - Add profile fields (name, avatar, preferences)
  - Prompt user to complete profile after signup
  - Store in `users_table`
  
- [ ] **User preferences**
  - Notification settings
  - Default meditation preferences
  - Language/timezone settings

---

## 📝 Quick Notes

**Recent Fixes:**
- ✅ OAuth: Created callback route + smart URL detection
- ✅ Double text: Removed duplicate welcome message in auth flow
- ✅ Security audit: Passwords properly masked, Supabase handles hashing (bcrypt)

**Security Status:**
- ✅ Passwords displayed as dots in UI (line 357-359 in auth/page.tsx)
- ✅ Supabase handles password hashing (industry-standard bcrypt)
- ✅ No passwords stored in your database schema
- ✅ HTTP-only cookies for session tokens
- ✅ No secrets exposed client-side

**Email Confirmations:**
- 🔧 Currently DISABLED (`supabase/config.toml` line 157: `enable_confirmations = false`)
- ✅ Users auto-confirmed on signup (good for dev/testing)
- 📝 For production: Tasks added to P2 section above

**Auth Features Status:**
- ✅ Signup/Login working
- ✅ Google OAuth working
- ✅ Session management working
- ⏳ Email confirmation (P2)
- ⏳ Password reset (P2)
- ⏳ Change password (P2)
- ⏳ One email = one account (add better error message, P2)

**Next:** Fix OpenAI chat integration
and many things



