# Neiji - TODO

## 🔥 High Priority

### ✅ Google OAuth - FIXED (needs setup)
- [x] Code fixed - redirects work properly now
- [ ] **Setup Required**: Add `NEXT_PUBLIC_SITE_URL=https://your-domain.com` to Vercel env vars
- [ ] **Setup Required**: Add `https://your-domain.com/auth/callback` to Supabase redirect URLs
- [ ] Test in production after setup

### 🐛 Bugs to Fix
- [ ] Fix doubled text when creating account/signing in via chat
  - Check: `src/app/(landing)/auth/page.tsx` around line 90
  
- [ ] Fix OpenAI chat integration
  - Files: `src/app/api/chat/route.ts`, check API key env vars
  - Test: Send message, check if response comes back

### 🎨 Features to Add  
- [ ] Loading animation for meditation generation (1-1.5 min wait)
  - Create breathing circle or progress indicator
  - File: `src/components/chat/shared/meditation-loading.tsx`

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

## 📝 Quick Notes

**OAuth Fix Summary:**
- Created: `src/app/auth/callback/route.ts` (handles OAuth)
- Created: `src/lib/utils/site-url.ts` (smart URL detection)
- Updated: All drawer components to use new helper

**Next:** Fix duplicate text bug, then chat integration


