# 🌸 BUSINESS MODEL NEIJI - SYSTÈME "FLOWERS"

**Date:** Janvier 2025  
**Status:** Proposition à valider via UXR

---

## 💡 CONCEPT

### Qu'est-ce que les Flowers ?

**Flowers (🌸)** = Monnaie virtuelle de Neiji
- Chaque méditation coûte des flowers selon sa durée
- **Formule:** ~1 flower = 10 secondes de méditation
- Les users reçoivent des flowers gratuits pour commencer
- Peuvent acheter des packs de flowers via Stripe

### Pourquoi "Flowers" ?

**Avantages vs. abonnement classique:**
- ✅ Plus visuel et engageant (gamification)
- ✅ Flexible (pay-as-you-go + freemium)
- ✅ Sentiment de "cultiver" son bien-être (métaphore growth)
- ✅ Permet des mechanics de reward (streaks, achievements)
- ✅ Moins de friction psychologique que "€X/mois"

**Symbolique:**
- 🌸 Flowers = croissance, beauté, nature
- Aligne avec le branding wellness/mindfulness
- Positif et Gen-Z friendly
- Potentiel viral (gift flowers, share...)

---

## 💰 PRICING STRATEGY

### Coût par Méditation (Exemples)

| Durée | Secondes | Flowers | Note |
|-------|----------|---------|------|
| 3 min | 180s | 18 🌸 | Session courte, quick calm |
| 5 min | 300s | 30 🌸 | Standard, most common |
| 10 min | 600s | 60 🌸 | Session complète |
| 15 min | 900s | 90 🌸 | Deep work |
| 20 min | 1200s | 120 🌸 | Session longue |

**Arrondi:** `Math.ceil(duration_seconds / 10)`

---

### Tiers de Pricing (Proposition)

#### 🎁 **FREEMIUM - Gratuit**

**Allocation mensuelle:** 50 flowers 🌸
- Équivaut à ~8 min de méditation/mois
- Ou 1-2 sessions de 5 min
- **Objectif:** Laisser découvrir la valeur, créer l'habitude

**Alternative:** 100 flowers de bienvenue (one-time)
- Permet 1-2 sessions complètes
- Puis encourage l'achat si value démontrée

**Renouvellement:** 
- Mensuel (1er du mois)
- Ou achat obligatoire après X jours

---

#### 💐 **SMALL PACK**

**Prix:** €4.99  
**Flowers:** 150 🌸  
**Équivalent:** ~25 min de méditation  
**Use case:** Utilisateurs occasionnels, test d'achat

**Rapport qualité/prix:** €0.033 par flower

---

#### 🌻 **MEDIUM PACK** (Meilleure valeur)

**Prix:** €9.99  
**Flowers:** 360 🌸  
**Équivalent:** ~60 min de méditation (6 sessions de 10 min)  
**Use case:** Utilisateurs réguliers (2-3x/semaine)

**Rapport qualité/prix:** €0.028 par flower  
**Discount vs Small:** -15%

**💡 Suggestion:** Mettre un badge "MOST POPULAR" ou "BEST VALUE"

---

#### 🌺 **LARGE PACK** (Meilleur deal)

**Prix:** €19.99  
**Flowers:** 900 🌸  
**Équivalent:** ~150 min de méditation (15 sessions de 10 min)  
**Use case:** Power users, usage quotidien

**Rapport qualité/prix:** €0.022 par flower  
**Discount vs Small:** -33%

**💡 Suggestion:** Badge "BEST DEAL"

---

#### 🌸 **SUBSCRIPTION (Option future)**

**Prix:** €9.99/mois  
**Flowers:** 600/mois (renouvelables)  
**Équivalent:** ~100 min/mois (10 sessions de 10 min)  
**Use case:** Utilisateurs très réguliers (3-4x/semaine minimum)

**Avantages supplémentaires:**
- Accès prioritaire aux nouvelles voix
- Méditations exclusives
- Support prioritaire
- Badge "Membre Premium" dans l'app

**Alternative:** €89/an (économie de 25%)

---

### 📊 Benchmark Concurrence

| App | Prix | Contenu | Business Model |
|-----|------|---------|----------------|
| **Calm** | €69.99/an | Bibliothèque fixe | Abonnement all-you-can-eat |
| **Headspace** | €49.99/an | Bibliothèque fixe | Abonnement all-you-can-eat |
| **Insight Timer** | Gratuit + €59.99/an | Gratuit + premium | Freemium |
| **Balance** | Gratuit 1 an puis €59.99/an | Personnalisé | Freemium trial |
| **Neiji** | Freemium + packs | Généré sur-mesure | 🌸 Flowers (pay-per-use) |

**Positionnement Neiji:**
- ✅ Plus flexible (pas d'engagement mensuel)
- ✅ Vraiment personnalisé (généré à la demande)
- ✅ Prix à la carte vs. engagement long terme
- ✅ Peut être moins cher pour usage occasionnel
- ⚠️ Peut être plus cher pour usage très intensif

**Stratégie:** Se positionner comme l'alternative "smart" et personnalisée

---

## 🎨 UX/UI DU SYSTÈME FLOWERS

### 1. Affichage du Solde

**Emplacement:** Header (toujours visible)

```
┌─────────────────────────────────────┐
│  🌸 128 flowers   [Avatar] [Menu]   │
└─────────────────────────────────────┘
```

**Comportement:**
- Au hover/click : tooltip "Your balance"
- Si < 50 flowers : couleur warning (orange)
- Si < 10 flowers : couleur critique (rouge)
- Animation quand flowers ajoutés (+30 🌸 ✨)

---

### 2. Prévisualisation du Coût

**Avant génération, afficher clairement:**

```
┌─────────────────────────────────────┐
│  Generate Meditation                │
│                                     │
│  Duration: 10 min                   │
│  Goal: Focus                        │
│  Voice: Female, calm                │
│                                     │
│  Cost: 60 🌸                        │
│  Your balance: 128 🌸 → 68 🌸       │
│                                     │
│  [Cancel]  [Generate for 60 🌸]    │
└─────────────────────────────────────┘
```

**Principes UX:**
- ✅ Transparence totale sur le coût
- ✅ Montre le nouveau solde après génération
- ✅ Pas de surprise (anti-pattern freemium agressif)

---

### 3. État "Out of Flowers"

**Écran:**

```
┌─────────────────────────────────────┐
│           🌸                        │
│     You're out of flowers!          │
│                                     │
│  This 10-min meditation needs 60🌸  │
│  but you only have 8🌸              │
│                                     │
│  Get more flowers to continue:      │
│                                     │
│  [💐 150🌸 - €4.99]                │
│  [🌻 360🌸 - €9.99] ⭐ BEST VALUE   │
│  [🌺 900🌸 - €19.99]               │
│                                     │
│  [Maybe later]                      │
└─────────────────────────────────────┘
```

**Tone of voice:**
- Doux, pas agressif
- "Get more flowers" vs "BUY NOW!!!"
- Option "Maybe later" toujours visible
- Pas de dark patterns

**Alternative douce:**
- "Try a 3-min meditation instead?" (18🌸)
- "Free version available" (méditation générique)

---

### 4. Flow d'Achat

**Étape 1: Choix du pack**
```
Choose your pack:

○ 💐 Small Pack - €4.99
  150 flowers (~25 min)
  
● 🌻 Medium Pack - €9.99  ⭐ MOST POPULAR
  360 flowers (~60 min)
  Best value - save 15%
  
○ 🌺 Large Pack - €19.99  💎 BEST DEAL
  900 flowers (~150 min)
  Best value - save 33%

[Continue to payment]
```

**Étape 2: Stripe Checkout**
- Redirection vers Stripe hosted checkout (sécurisé, PCI compliant)
- Email requis
- Carte bancaire
- Confirmation

**Étape 3: Confirmation avec célébration**
```
┌─────────────────────────────────────┐
│          ✨ 🌸 ✨                  │
│                                     │
│    +360 flowers added!              │
│                                     │
│    Your new balance: 368 🌸         │
│                                     │
│    Ready to create amazing          │
│    meditations? 🧘‍♀️              │
│                                     │
│    [Start meditating]               │
└─────────────────────────────────────┘
```

**Animations:**
- Confetti
- Flowers tombant du haut
- Son agréable (optionnel)

---

### 5. Rewards & Gamification

#### Daily Login Bonus
```
┌─────────────────────────────────────┐
│  Welcome back! 🌸                   │
│                                     │
│  Daily bonus: +5 flowers            │
│  Streak: 3 days 🔥                  │
│                                     │
│  Come back tomorrow for +5 more!    │
└─────────────────────────────────────┘
```

#### Achievements
```
🏆 First Meditation       → +10 🌸
🏆 5 Meditations          → +20 🌸
🏆 7-Day Streak           → +50 🌸
🏆 Share with a friend    → +30 🌸
🏆 Complete your profile  → +15 🌸
```

#### Referral Program
```
Invite a friend:
- They get: 100 free flowers
- You get: 100 free flowers when they sign up

[Copy referral link]
```

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### Database Schema

#### Table: `user_credits`
```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flower_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT user_credits_unique_user UNIQUE(user_id),
  CONSTRAINT flower_balance_non_negative CHECK (flower_balance >= 0)
);

-- Index for fast user lookup
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend can modify (via service role)
```

#### Table: `credit_transactions`
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive = earned/purchased, Negative = spent
  type VARCHAR(50) NOT NULL, -- 'welcome_bonus', 'daily_reward', 'purchase', 'spent', 'refund', 'achievement'
  description TEXT,
  meditation_id UUID REFERENCES meditation_sessions(id), -- If spent on meditation
  stripe_payment_id VARCHAR(255), -- If purchased
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

#### Table: `purchase_history`
```sql
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  flowers_purchased INTEGER NOT NULL,
  amount_paid_cents INTEGER NOT NULL, -- In cents (e.g., 999 = €9.99)
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  pack_type VARCHAR(50), -- 'small', 'medium', 'large'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_purchase_history_user ON purchase_history(user_id);
CREATE INDEX idx_purchase_stripe_session ON purchase_history(stripe_session_id);
```

---

### API Endpoints

#### GET `/api/user/flowers`
**Description:** Get user's current flower balance

**Response:**
```json
{
  "balance": 128,
  "total_earned": 200,
  "total_spent": 72,
  "total_purchased": 0,
  "last_transaction": {
    "type": "daily_reward",
    "amount": 5,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

#### POST `/api/meditation/generate`
**Description:** Generate meditation (checks & deducts flowers)

**Request:**
```json
{
  "duration": 600,
  "goal": "focus",
  "voice": "female",
  "guidance": "confirmed"
}
```

**Flow:**
1. Calculate cost: `cost = Math.ceil(600 / 10) = 60 flowers`
2. Check user balance: `SELECT flower_balance FROM user_credits WHERE user_id = ?`
3. If insufficient: Return 402 Payment Required
4. Start transaction:
   - Deduct flowers: `UPDATE user_credits SET flower_balance = flower_balance - 60`
   - Log transaction: `INSERT INTO credit_transactions ...`
5. Generate meditation
6. If generation fails: Rollback (refund flowers)
7. Commit transaction

**Response (success):**
```json
{
  "meditation_url": "https://...",
  "cost": 60,
  "new_balance": 68
}
```

**Response (insufficient funds):**
```json
{
  "error": "insufficient_flowers",
  "required": 60,
  "current": 8,
  "shortage": 52
}
```

---

#### POST `/api/flowers/purchase`
**Description:** Create Stripe checkout session

**Request:**
```json
{
  "pack_type": "medium" // 'small' | 'medium' | 'large'
}
```

**Flow:**
1. Validate pack_type
2. Get pricing: `{ small: 150, medium: 360, large: 900 }`
3. Create Stripe checkout session:
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: {
        name: '🌻 Medium Flower Pack',
        description: '360 flowers (~60 min of meditation)',
        images: ['https://neiji.co/flowers-medium.png']
      },
      unit_amount: 999 // €9.99 in cents
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: 'https://neiji.co/purchase/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://neiji.co/purchase/cancelled',
  client_reference_id: user_id,
  metadata: {
    pack_type: 'medium',
    flowers: 360
  }
});
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

---

#### POST `/api/webhooks/stripe` (Server-side only)
**Description:** Handle Stripe webhook events

**Events to handle:**

**`checkout.session.completed`:**
```javascript
const session = event.data.object;
const { client_reference_id: userId, metadata } = session;
const flowers = parseInt(metadata.flowers);

// Add flowers to user
await addFlowersToUser(userId, flowers, {
  type: 'purchase',
  stripe_session_id: session.id,
  amount_paid: session.amount_total
});
```

**`charge.refunded`:**
```javascript
// Deduct flowers back (if user still has them)
await deductFlowersFromUser(userId, flowers, {
  type: 'refund',
  stripe_payment_id: charge.id
});
```

**Security:**
- Verify Stripe signature: `stripe.webhooks.constructEvent(body, signature, webhookSecret)`
- Use idempotency keys to prevent duplicate processing
- Log all webhook events

---

### Flower Management Functions

#### `calculateMeditationCost(duration_seconds: number): number`
```typescript
export function calculateMeditationCost(durationSeconds: number): number {
  // 1 flower = 10 seconds
  return Math.ceil(durationSeconds / 10);
}

// Examples:
calculateMeditationCost(180);  // 3 min → 18 flowers
calculateMeditationCost(300);  // 5 min → 30 flowers
calculateMeditationCost(600);  // 10 min → 60 flowers
```

#### `checkUserBalance(userId: string, requiredFlowers: number): Promise<boolean>`
```typescript
export async function checkUserBalance(
  userId: string, 
  requiredFlowers: number
): Promise<{ hasEnough: boolean; current: number; shortage: number }> {
  const { data } = await supabase
    .from('user_credits')
    .select('flower_balance')
    .eq('user_id', userId)
    .single();
  
  const current = data?.flower_balance || 0;
  const hasEnough = current >= requiredFlowers;
  const shortage = hasEnough ? 0 : requiredFlowers - current;
  
  return { hasEnough, current, shortage };
}
```

#### `deductFlowers(userId: string, amount: number, metadata: object): Promise<void>`
```typescript
export async function deductFlowers(
  userId: string,
  amount: number,
  metadata: {
    type: string;
    description?: string;
    meditation_id?: string;
  }
): Promise<void> {
  // Start transaction
  const { data: credits } = await supabase
    .from('user_credits')
    .select('flower_balance')
    .eq('user_id', userId)
    .single();
  
  const balanceBefore = credits.flower_balance;
  const balanceAfter = balanceBefore - amount;
  
  if (balanceAfter < 0) {
    throw new Error('Insufficient flowers');
  }
  
  // Deduct flowers (atomic operation)
  await supabase.rpc('deduct_flowers_atomic', {
    p_user_id: userId,
    p_amount: amount
  });
  
  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: metadata.type,
    description: metadata.description,
    meditation_id: metadata.meditation_id,
    balance_before: balanceBefore,
    balance_after: balanceAfter
  });
}
```

#### `addFlowers(userId: string, amount: number, metadata: object): Promise<void>`
```typescript
export async function addFlowers(
  userId: string,
  amount: number,
  metadata: {
    type: string;
    description?: string;
    stripe_session_id?: string;
  }
): Promise<void> {
  const { data: credits } = await supabase
    .from('user_credits')
    .select('flower_balance')
    .eq('user_id', userId)
    .single();
  
  const balanceBefore = credits?.flower_balance || 0;
  const balanceAfter = balanceBefore + amount;
  
  // Add flowers
  await supabase.rpc('add_flowers_atomic', {
    p_user_id: userId,
    p_amount: amount
  });
  
  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: amount,
    type: metadata.type,
    description: metadata.description,
    stripe_payment_id: metadata.stripe_session_id,
    balance_before: balanceBefore,
    balance_after: balanceAfter
  });
}
```

---

## 🔒 SÉCURITÉ

### Principes Critiques

1. **TOUTES les vérifications côté serveur**
   - JAMAIS faire confiance au client
   - Le client envoie juste la requête, le serveur vérifie tout

2. **Transactions atomiques**
   - Utiliser `BEGIN; ... COMMIT;` pour éviter les race conditions
   - Si génération échoue → rollback automatique

3. **Rate limiting**
   - Max X achats par jour par user
   - Max X générations par minute
   - Détection d'activité suspecte

4. **Validation Stripe webhooks**
   - Toujours vérifier la signature
   - Utiliser idempotency keys
   - Logger tous les événements

5. **Row Level Security (RLS)**
   - Users peuvent SEULEMENT voir leur propre balance
   - Seul le backend (service role) peut modifier les flowers

---

## 📊 ANALYTICS & KPIs

### Métriques Clés à Tracker

**Conversion:**
- % users gratuits → payants
- Temps moyen avant premier achat
- Pack le plus acheté

**Engagement:**
- Flowers dépensés par user par semaine
- Taux de rétention après épuisement flowers gratuits
- Fréquence d'achat (repeat purchase rate)

**Revenue:**
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- Churn rate

**Comportement:**
- Durée de méditation moyenne
- Goal le plus populaire
- Combien de flowers avant abandon ?

---

## 💡 QUESTIONS UXR À VALIDER

**À ajouter dans tes prochains interviews :**

### 1. Willingness to Pay
> "Imagine que Neiji génère des méditations personnalisées rien que pour toi. Tu serais prêt à payer combien par mois pour ça ?"

*Laisse-les répondre spontanément*

### 2. Préférence Modèle
> "Qu'est-ce que tu préfères :
> - A) Abonnement €9.99/mois illimité
> - B) Acheter des 'packs' à la carte (€5-20) quand tu en as besoin
> - C) Gratuit avec limite (ex: 1-2 méditations/mois)"

### 3. Perception "Flowers"
> "Si l'app utilisait une monnaie virtuelle appelée 'Flowers' (🌸) pour payer les méditations, qu'en penses-tu ? C'est fun ou enfantin ?"

### 4. Freemium Sweet Spot
> "Combien de méditations gratuites par mois te semblerait généreux avant de devoir payer ?"

Observe si : 1-2 (trop peu) / 3-5 (ok) / 10+ (trop généreux)

### 5. Pricing Perception
> *Montre les 3 packs*
> "Si tu devais acheter, lequel tu prendrais ? Pourquoi ?"

Vérifie si le "Medium Pack" est perçu comme best value.

### 6. Transparence du Coût
> *Montre mockup avec coût affiché*
> "Avant de générer une méditation, on te montre qu'elle coûtera 60 flowers. Ça te dérange ou c'est rassurant ?"

### 7. Rewards/Gamification
> "Si tu avais des 'bonus flowers' pour revenir tous les jours, ça t'encouragerait à utiliser l'app régulièrement ?"

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1: Validation UXR (Semaine 2-3)
- [ ] Intégrer les questions pricing dans le script d'interview
- [ ] Tester la réaction au concept "Flowers"
- [ ] Identifier le pricing optimal
- [ ] Valider freemium vs. paid preference

### Phase 2: MVP Business Model (Semaine 4-6)
- [ ] Implémenter la DB schema (user_credits, transactions)
- [ ] Créer les endpoints API
- [ ] Intégrer Stripe en mode test
- [ ] Build UI basique (balance, purchase modal)
- [ ] Tester le flow complet

### Phase 3: Soft Launch (Semaine 7-8)
- [ ] Launch avec 10-20 beta testers
- [ ] Observer comportements d'achat réels
- [ ] Ajuster pricing si nécessaire
- [ ] Ajouter gamification (daily rewards, etc.)

### Phase 4: Public Launch (Semaine 9+)
- [ ] Passer Stripe en mode production
- [ ] Marketing push
- [ ] Monitor conversions et optimize

---

## 🤔 QUESTIONS OUVERTES

**À décider après UXR :**

1. **Allocation freemium :** 50 flowers/mois ou 100 flowers one-time ?
2. **Subscription ou non ?** Ajouter une option abonnement ou rester 100% pay-per-use ?
3. **Rewards aggressive ou soft ?** Daily bonus de 5 flowers vs 10 flowers ?
4. **Refills automatiques ?** Option "auto-recharge when balance < 50 flowers"
5. **Gifting :** Feature "offrir des flowers à un ami" prioritaire ?
6. **Tiered benefits ?** Users qui ont dépensé €100+ ont avantages (voix exclusive, etc.) ?

---

## 📚 RESSOURCES

**Stripe Documentation :**
- Checkout: https://stripe.com/docs/payments/checkout
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

**Inspiration (apps avec monnaies virtuelles) :**
- Duolingo (Lingots)
- Habitica (Gold coins)
- Finch (Energy)

**Analytics :**
- Mixpanel / Amplitude pour tracking
- Stripe Dashboard pour revenue metrics

---

*Document vivant - À mettre à jour après validation UXR*

