# Meditation Drawer Design Documentation

## Overview

The meditation drawer is a seamlessly integrated UI component that extends from the chat bar, providing meditation customization options while keeping the chat input accessible.

## Design Principles

### 1. **Seamless Integration**
The meditation drawer appears as a natural extension of the chat bar, not a separate overlay.

### 2. **Chat Bar Always Accessible**
Unlike the auth drawer, the meditation drawer keeps the chat bar visible so users can:
- Type custom meditation descriptions
- Use the send button to generate from text
- Toggle meditation mode on/off

### 3. **Responsive Design**
Works on both desktop and mobile with appropriate height adjustments.

---

## Technical Implementation

### Component Structure

```
enhanced-chat-input.tsx (z-40)
  └─ Chat Bar (always visible)
     - Brain button (toggle meditation mode)
     - User button (opens auth drawer)
     - Input field
     - Send button

meditation-drawer.tsx (z-30, behind chat bar)
  └─ Meditation Panel
     - Handlebar
     - Parameter selectors
     - Generate buttons
```

### Height Calculations

#### Chat Bar Height
```typescript
// Desktop: 
// - Padding top: 16px (p-4)
// - Input height: 48px (h-12)
// - Padding bottom: 16px (p-4)
// - Total: ~80px

// Mobile:
// - Padding top: 12px (p-3)
// - Input height: 48px (h-12)
// - Padding bottom: 12px + safe-area-inset-bottom (0-34px)
// - Total: ~72-106px

// Safe Calculation: 96px
const chatBarHeight = 96;
```

#### Drawer Heights
```typescript
// Compact mode: 45dvh (min) or calc(100dvh-140px)
// Expanded mode: 70dvh (min) or calc(100dvh-140px)

// Bottom padding: chatBarHeight (96px) to prevent button overlap
```

### Visual Continuity

#### When Meditation Mode is OFF
```css
Chat Bar:
  - rounded-t-3xl (rounded top)
  - border-t (top border)
  - shadow-2xl (full shadow)
  - bg-white/95 backdrop-blur-md

Meditation Drawer:
  - h-0 (collapsed)
  - opacity-0 (invisible)
```

#### When Meditation Mode is ON
```css
Chat Bar:
  - rounded-t-none (no top rounding)
  - border-t-0 (no top border)
  - shadow-none (no shadow)
  - bg-white/95 backdrop-blur-md (unchanged)

Meditation Drawer:
  - h-[45dvh] or h-[70dvh] (expanded)
  - opacity-100 (visible)
  - rounded-t-3xl (rounded top)
  - border-t (top border)
  - shadow-[0_-8px_30px] (shadow on top only)
  - bg-white/95 backdrop-blur-md (matches chat bar)
```

**Result**: Chat bar and drawer appear as one continuous element.

---

## Animation Timeline

### Opening Animation (500ms total)

```
Time    Element                 Action                          Duration    Delay
────────────────────────────────────────────────────────────────────────────────
0ms     Drawer Container       Start height expansion          500ms       0ms
0ms     Chat Bar               Remove top border/rounding      500ms       0ms

200ms   Drawer Content         Start fade in + slide up        400ms       200ms

500ms   Drawer Container       Fully expanded                  -           -
600ms   Drawer Content         Fully visible                   -           -
```

### Closing Animation (400ms total)

```
Time    Element                 Action                          Duration    Delay
────────────────────────────────────────────────────────────────────────────────
0ms     Drawer Content         Start fade out + slide down     200ms       0ms
0ms     Drawer Container       Start height collapse           400ms       0ms
0ms     Chat Bar               Add back top border/rounding    500ms       0ms

200ms   Drawer Content         Fully hidden                    -           -
400ms   Drawer Container       Fully collapsed                 -           -
500ms   Chat Bar               Fully restored                  -           -
```

---

## CSS Classes Reference

### Meditation Drawer Container

```tsx
<div className={cn(
  "fixed right-1/2 translate-x-1/2 w-full max-w-xl",
  "transition-all ease-out",
  "bottom-0 z-30",
  isOpen 
    ? "h-[min(45dvh,calc(100dvh-140px))] duration-500" 
    : "h-0 duration-400"
)} />
```

**Key Properties:**
- `fixed right-1/2 translate-x-1/2`: Centered horizontally
- `bottom-0`: Starts from bottom (same as chat bar)
- `z-30`: Behind chat bar (z-40)
- Height transitions smoothly

### Drawer Surface

```tsx
<div className={cn(
  "h-full bg-white/95 backdrop-blur-md",
  "overflow-hidden transition-all ease-out",
  "border-l border-r border-t border-orange-100/50",
  "rounded-t-3xl",
  "shadow-[0_-8px_30px_rgb(0,0,0,0.12)]",
  isOpen ? "opacity-100 duration-500" : "opacity-0 duration-300"
)} />
```

**Key Properties:**
- `bg-white/95 backdrop-blur-md`: Matches chat bar
- `border-l border-r border-t`: NO bottom border (merges with chat bar)
- `rounded-t-3xl`: Only top rounded
- `shadow-[0_-8px_30px]`: Shadow only on top/sides

### Scrollable Content

```tsx
<div 
  className="flex-1 overflow-y-auto px-4"
  style={{ paddingBottom: `${chatBarHeight}px` }}
/>
```

**Key Properties:**
- `paddingBottom: 96px`: Prevents buttons from being hidden by chat bar
- `overflow-y-auto`: Scrollable when content exceeds height
- Works on both mobile and desktop

### Chat Bar (Meditation Mode)

```tsx
<div className={cn(
  "bg-white/95 backdrop-blur-md",
  "border-l border-r border-orange-100/50",
  "transition-all duration-500 ease-out",
  shouldHideChatBar 
    ? "p-0 rounded-t-3xl border-t shadow-2xl" 
    : "p-3 rounded-t-3xl border-t shadow-2xl md:p-4",
  isMeditationDrawerOpen && !shouldHideChatBar && 
    "rounded-t-none border-t-0 shadow-none"
)} />
```

**Key Conditional Styling:**
- Normal: Full rounded top, border, shadow
- Meditation open: No top rounding, no top border, no shadow
- Auth drawer open: Hidden completely

---

## State Management

### Meditation Mode Toggle

```typescript
const isMeditationDrawerOpen = meditationMode === "meditation";
```

- **Brain button** toggles between `"chat"` and `"meditation"` modes
- When `"meditation"`, drawer extends upward
- Chat bar remains visible and functional

### Auth Drawer vs Meditation Drawer

```typescript
const shouldHideChatBar = isAuthDrawerOpen;
```

- **Auth drawer**: Hides chat bar completely
- **Meditation drawer**: Keeps chat bar visible

---

## Responsive Behavior

### Desktop (md and above)
```css
- Chat bar padding: p-4 (16px)
- Drawer max height: 70dvh (expanded)
- Wider viewport allows more vertical space
```

### Mobile
```css
- Chat bar padding: p-3 (12px)
- Chat bar bottom padding: pb-[calc(12px+env(safe-area-inset-bottom))]
- Drawer max height: 70dvh (expanded), accounts for iOS notch
- Touch-optimized button sizes (size-12 for brain button)
```

### Safe Area Handling
```typescript
// iOS devices with notch
pb-[calc(12px+env(safe-area-inset-bottom))]

// This adds extra padding on iPhone X and newer
// Ensures buttons aren't hidden by home indicator
```

---

## User Interactions

### Opening Meditation Mode
1. User clicks **Brain button**
2. `meditationMode` changes to `"meditation"`
3. Chat bar loses top rounding and border
4. Drawer animates upward (500ms)
5. Content fades in (400ms, delayed 200ms)

### Typing Meditation Description
1. User can type in input field (always accessible)
2. Placeholder changes to "Describe your meditation..."
3. Send button shows **Sparkles icon** (✨)
4. Pressing enter or send submits meditation request

### Using Parameter Panel
1. User can scroll through meditation options
2. Select duration, voice, guidance, background, goal
3. Click "Generate Meditation" button
4. Bottom padding ensures button is always visible above chat bar

### Closing Meditation Mode
1. User clicks **Brain button** again
2. `meditationMode` changes to `"chat"`
3. Drawer animates downward (400ms)
4. Chat bar regains top rounding and border
5. Input placeholder returns to normal

---

## Z-Index Layering

```
z-50: Auth drawer (highest, covers everything)
z-40: Chat bar (always visible, above meditation drawer)
z-30: Meditation drawer (behind chat bar)
z-20: Backdrop overlays (for auth drawer)
z-0:  Main chat content
```

This ensures:
- Chat bar is always on top when visible
- Auth drawer covers everything when open
- Meditation drawer sits behind chat bar but above content

---

## Accessibility Considerations

### Keyboard Navigation
- Tab through buttons in logical order
- Enter key submits from input field
- Escape key closes drawers (could be added)

### Touch Targets
- Brain button: `size-12` (48px) - meets minimum touch target
- Other buttons: `size-11` (44px) or larger
- Input field: `h-12` (48px) - easy to tap

### Visual Feedback
- Hover states on desktop (`hover:scale-105`)
- Active states on mobile (`active:scale-95`)
- Clear visual indicator when meditation mode is active (orange badge)

---

## Common Issues & Solutions

### Issue: Buttons Hidden by Chat Bar
**Solution**: Added `paddingBottom: 96px` to scrollable container

### Issue: Visible Seam Between Elements
**Solution**: 
- Removed chat bar top border when meditation open
- Removed chat bar top rounding when meditation open
- Matching background colors and blur

### Issue: Jumpy Animations
**Solution**: 
- Staggered animations with delays
- Consistent easing (`ease-out`)
- Matching transition durations

### Issue: Mobile Keyboard Overlap
**Solution**: 
- Used `dvh` units (dynamic viewport height)
- Accounted for safe areas
- Calculated heights properly

---

## Future Enhancements

### Potential Improvements

1. **Gesture Controls**
   - Swipe down to close meditation mode
   - Pinch to expand/collapse quickly

2. **Smooth Height Transitions**
   - Animate between compact and expanded states
   - Consider spring physics for more natural feel

3. **Keyboard Shortcut**
   - `Cmd+M` to toggle meditation mode
   - Quick access without mouse

4. **Save Preferences**
   - Remember last used meditation settings
   - Quick-access to favorite configurations

5. **Mobile Keyboard Detection**
   - Adjust drawer height when keyboard appears
   - Maintain visibility of important controls

---

## Code Examples

### Complete Integration Example

```tsx
// In enhanced-chat-input.tsx
<>
  {/* Auth Drawer - covers everything when open */}
  <EnhancedDrawer 
    isOpen={isAuthDrawerOpen} 
    onClose={closeDrawer} 
    isAuthenticated={isAuthenticated} 
  />

  {/* Meditation Drawer - extends from chat bar */}
  <MeditationDrawer
    isOpen={isMeditationDrawerOpen}
    onClose={() => setMeditationMode("chat")}
    onGenerate={handleMeditationGenerate}
    isGenerating={isGeneratingMeditation}
    parsedOverrides={parsedOverrides}
  />

  {/* Chat Bar - always visible except for auth drawer */}
  <div className={cn(
    "fixed right-1/2 bottom-0 z-40",
    "w-full max-w-xl translate-x-1/2"
  )}>
    <div className={cn(
      "bg-white/95 backdrop-blur-md",
      "transition-all duration-500 ease-out",
      isMeditationDrawerOpen && "rounded-t-none border-t-0 shadow-none"
    )}>
      {/* Chat bar content */}
    </div>
  </div>
</>
```

---

## Testing Checklist

- [ ] Meditation mode opens smoothly
- [ ] No gap between chat bar and drawer
- [ ] Generate buttons fully visible (not hidden by chat bar)
- [ ] Chat input remains functional in meditation mode
- [ ] Scrolling works in meditation panel
- [ ] Expanding/collapsing panel works
- [ ] Works on desktop (large screens)
- [ ] Works on mobile (small screens)
- [ ] Works on iPhone with notch
- [ ] Works on Android
- [ ] Auth drawer still functions correctly
- [ ] Transitions are smooth
- [ ] No console errors

---

## Maintenance Notes

### When Modifying Chat Bar Height
1. Update `chatBarHeight` constant in `meditation-drawer.tsx`
2. Test on both mobile and desktop
3. Verify buttons don't overlap
4. Check safe area handling on iOS

### When Modifying Drawer Styling
1. Ensure background colors match (`bg-white/95`)
2. Keep backdrop blur consistent (`backdrop-blur-md`)
3. Maintain border continuity
4. Test visual seam at junction

### When Adding Features
1. Consider z-index layering
2. Maintain responsive behavior
3. Test with keyboard open/closed
4. Verify animations still smooth

---

## Resources

- [ANIMATION_SYSTEM.md](./ANIMATION_SYSTEM.md) - General animation patterns
- [Tailwind CSS Transitions](https://tailwindcss.com/docs/transition-property)
- [Dynamic Viewport Units](https://developer.mozilla.org/en-US/docs/Web/CSS/length#vh)
- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)



