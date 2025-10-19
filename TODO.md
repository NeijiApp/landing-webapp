# Neiji - TODO

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

- [ ] Add Stripe payment integration
  - Think about business model
  - Implement payment flow and subscription system

- [ ] Enhance system prompt
  - Improve AI guidance quality
  - Review and refine prompts in `src/app/api/chat/prompts.ts`

- [ ] Product strategy, UI/UX research, and website wording
  - Define features and user journey
  - Research optimal UX patterns
  - Refine website copy and messaging

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



