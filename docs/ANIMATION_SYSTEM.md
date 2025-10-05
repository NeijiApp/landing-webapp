# Animation System Documentation

## Overview

This document describes the animation system used for the chatbar drawer and provides reusable patterns for implementing similar animations throughout the application.

## Core Principles

### 1. **Two-Phase Animation State**
- **Rendering State (`shouldRender`)**: Controls whether the element is in the DOM
- **Animation State (`isAnimating`)**: Controls the visual animation classes

This separation ensures smooth animations by:
1. Adding elements to DOM before animating them in (opening)
2. Animating elements out before removing them from DOM (closing)

### 2. **Staggered Timing**
Animations use carefully orchestrated delays to create a natural, flowing experience:
- Elements don't all animate simultaneously
- Related elements have coordinated timing
- Opening and closing animations mirror each other

### 3. **Easing Functions**
- Use `ease-out` for most animations (natural deceleration)
- Consistent easing across related elements
- Duration varies based on element importance and size

---

## Chatbar Drawer Animation

### Implementation Pattern

```typescript
const [shouldRender, setShouldRender] = useState(false);
const [isAnimating, setIsAnimating] = useState(false);

useEffect(() => {
  if (isOpen) {
    // Opening sequence
    setShouldRender(true);  // Step 1: Add to DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);  // Step 2: Trigger animation
      });
    });
  } else {
    // Closing sequence
    setIsAnimating(false);  // Step 1: Start animation
    const timer = setTimeout(() => {
      setShouldRender(false);  // Step 2: Remove from DOM
    }, 500);  // Match longest animation duration
    return () => clearTimeout(timer);
  }
}, [isOpen]);
```

### Animation Timeline

#### **Opening Animation (Total: ~700ms)**

```
Time    Element                 Action                          Duration    Delay
────────────────────────────────────────────────────────────────────────────────
0ms     Chat Buttons           Start fade out + scale down     200ms       0ms
0ms     Drawer Container       Start height expansion          500ms       0ms
0ms     Backdrop               Start fade in                   400ms       0ms

100ms   Brain Button           Start fade back in              400ms       100ms
100ms   Input Form             Start fade back in              400ms       100ms

150ms   Profile Button         Start fade back in              400ms       150ms

200ms   Drawer Content         Start fade in + slide up        400ms       200ms
200ms   Send Button            Start fade back in              400ms       200ms

400ms   Backdrop               Fully visible                   -           -
500ms   Drawer Container       Fully expanded                  -           -
550ms   Profile Button         Fully visible                   -           -
600ms   Drawer Content         Fully visible                   -           -
600ms   Send Button            Fully visible                   -           -
```

#### **Closing Animation (Total: ~500ms)**

```
Time    Element                 Action                          Duration    Delay
────────────────────────────────────────────────────────────────────────────────
0ms     Drawer Content         Start fade out + slide down     200ms       0ms
0ms     Chat Buttons           Start fade out                  200ms       0ms
0ms     Profile Button         Start scale to 0 + rotate       200ms       0ms
0ms     Send Button            Start scale to 0 + rotate       200ms       0ms

100ms   Drawer Container       Start height collapse           400ms       0ms
100ms   Backdrop               Start fade out                  400ms       0ms

200ms   Drawer Content         Fully hidden                    -           -
200ms   Buttons                Fully hidden                    -           -

400ms   Chat Buttons           Start fade back in              400ms       100ms

500ms   Drawer Container       Fully collapsed                 -           -
500ms   Backdrop               Fully hidden                    -           -
600ms   Chat Buttons           Fully visible                   -           -
```

---

## CSS Classes Reference

### Backdrop Overlay

```tsx
<div className={cn(
  "fixed inset-0 bg-black/10 backdrop-blur-[2px] z-30 transition-all ease-out",
  isAnimating 
    ? "opacity-100 duration-400"           // Opening: 400ms fade in
    : "opacity-0 pointer-events-none duration-300"  // Closing: 300ms fade out
)} />
```

**Key Details:**
- `backdrop-blur-[2px]`: Subtle blur (not distracting)
- `pointer-events-none`: Disable clicks when hidden
- `z-30`: Below drawer (z-40) but above content

### Drawer Container (Height Animation)

```tsx
<div className={cn(
  "fixed right-1/2 translate-x-1/2 w-full max-w-xl z-50 transition-all ease-out",
  isAnimating 
    ? "bottom-0 h-[420px] duration-500"    // Opening: 500ms expand
    : "bottom-0 h-0 duration-400"          // Closing: 400ms collapse
)} />
```

**Key Details:**
- `bottom-0`: Anchored to bottom (extends upward)
- `h-[420px]`: Fixed height when open
- `h-0`: Collapsed when closed
- Longer duration for opening (500ms) feels more natural

### Drawer Surface (Scale + Opacity)

```tsx
<div className={cn(
  "h-full bg-white rounded-t-3xl shadow-2xl border border-orange-100/50 overflow-hidden transition-all ease-out",
  isAnimating 
    ? "opacity-100 scale-y-100 origin-bottom duration-500"  // Opening
    : "opacity-0 scale-y-95 origin-bottom duration-300"     // Closing
)} />
```

**Key Details:**
- `origin-bottom`: Scale from bottom (matches height animation)
- `scale-y-95`: Slight scale for depth effect
- `overflow-hidden`: Prevents content overflow during animation
- `rounded-t-3xl`: Only top corners rounded (extends from bar)

### Drawer Content (Fade + Slide)

```tsx
<div className={cn(
  "h-full transition-all ease-out",
  isAnimating 
    ? "opacity-100 translate-y-0 duration-400 delay-200"   // Opening: delayed
    : "opacity-0 translate-y-6 duration-200"               // Closing: immediate
)} />
```

**Key Details:**
- `delay-200`: Content appears after drawer starts expanding
- `translate-y-6`: Subtle upward slide (24px)
- Faster closing (200ms) for snappy feel

### Profile Button (Scale + Rotate)

```tsx
<Button className={cn(
  "size-11 rounded-full transition-all ease-out",
  isOpen 
    ? "scale-0 opacity-0 rotate-180 duration-200"                    // Closing
    : "scale-100 opacity-100 rotate-0 duration-400 delay-150"        // Opening
)} />
```

**Key Details:**
- `rotate-180`: Adds playful spin effect
- `delay-150`: Staggered appearance (after brain button)
- `scale-0`: Complete disappearance
- `hover:scale-105 active:scale-95`: Interactive feedback

### Brain Button (Scale)

```tsx
<Button className={cn(
  "size-12 rounded-full transition-all ease-out",
  isOpen 
    ? "scale-90 opacity-70 duration-200"                    // Closing
    : "scale-100 opacity-100 duration-400 delay-100"        // Opening
)} />
```

**Key Details:**
- `scale-90`: Partial scale (not fully hidden)
- `opacity-70`: Dimmed but visible
- `delay-100`: First button to reappear

### Send Button (Scale + Rotate)

```tsx
<Button className={cn(
  "size-9 rounded-full transition-all ease-out",
  isOpen 
    ? "scale-0 opacity-0 rotate-180 pointer-events-none duration-200"  // Closing
    : "scale-100 opacity-100 rotate-0 duration-400 delay-200"          // Opening
)} />
```

**Key Details:**
- `pointer-events-none`: Disable clicks when hidden
- `delay-200`: Last button to reappear (coordinated with content)
- `rotate-180`: Matches profile button rotation

### Input Form (Scale + Opacity)

```tsx
<form className={cn(
  "relative flex-1 transition-all ease-out",
  isOpen 
    ? "scale-95 opacity-70 duration-200"              // Closing
    : "scale-100 opacity-100 duration-400 delay-100"  // Opening
)} />
```

**Key Details:**
- `scale-95`: Subtle shrink
- `opacity-70`: Dimmed but visible
- `delay-100`: Coordinated with brain button

---

## Reusable Animation Patterns

### Pattern 1: Expanding Panel from Bottom

**Use Case:** Modals, sheets, bottom drawers

```tsx
// State management
const [shouldRender, setShouldRender] = useState(false);
const [isAnimating, setIsAnimating] = useState(false);

useEffect(() => {
  if (isOpen) {
    setShouldRender(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsAnimating(true));
    });
  } else {
    setIsAnimating(false);
    const timer = setTimeout(() => setShouldRender(false), 500);
    return () => clearTimeout(timer);
  }
}, [isOpen]);

// Render
if (!shouldRender) return null;

return (
  <>
    {/* Backdrop */}
    <div className={cn(
      "fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-all ease-out",
      isAnimating ? "opacity-100 duration-400" : "opacity-0 duration-300"
    )} />
    
    {/* Panel */}
    <div className={cn(
      "fixed bottom-0 w-full transition-all ease-out",
      isAnimating ? "h-[400px] duration-500" : "h-0 duration-400"
    )}>
      <div className={cn(
        "h-full bg-white rounded-t-3xl transition-all ease-out",
        isAnimating 
          ? "opacity-100 scale-y-100 origin-bottom duration-500"
          : "opacity-0 scale-y-95 origin-bottom duration-300"
      )}>
        {/* Content with delay */}
        <div className={cn(
          "transition-all ease-out",
          isAnimating
            ? "opacity-100 translate-y-0 duration-400 delay-200"
            : "opacity-0 translate-y-6 duration-200"
        )}>
          {children}
        </div>
      </div>
    </div>
  </>
);
```

### Pattern 2: Staggered Button Group

**Use Case:** Toolbars, action buttons, navigation

```tsx
const buttons = [
  { id: 'btn1', delay: 100 },
  { id: 'btn2', delay: 150 },
  { id: 'btn3', delay: 200 },
];

return buttons.map((btn) => (
  <Button
    key={btn.id}
    className={cn(
      "transition-all ease-out",
      isVisible
        ? `scale-100 opacity-100 rotate-0 duration-400 delay-${btn.delay}`
        : "scale-0 opacity-0 rotate-180 duration-200"
    )}
  />
));
```

### Pattern 3: Coordinated Content Swap

**Use Case:** Tab switching, view transitions

```tsx
// Old content fades out fast
<div className={cn(
  "transition-all ease-out",
  isActive ? "opacity-100 duration-400 delay-200" : "opacity-0 duration-200"
)}>
  {oldContent}
</div>

// New content fades in with delay
<div className={cn(
  "transition-all ease-out",
  isActive ? "opacity-100 duration-400 delay-200" : "opacity-0 duration-200"
)}>
  {newContent}
</div>
```

---

## Best Practices

### ✅ Do's

1. **Use `requestAnimationFrame` for opening animations**
   - Ensures element is in DOM before animation starts
   - Double RAF for reliability: `requestAnimationFrame(() => requestAnimationFrame(() => ...))`

2. **Match cleanup timeout to longest animation**
   - Prevents premature DOM removal
   - Add 50-100ms buffer for safety

3. **Use `ease-out` for most animations**
   - Natural deceleration
   - Feels more responsive than `ease-in-out`

4. **Stagger related elements by 50-150ms**
   - Creates flow and hierarchy
   - Prevents overwhelming simultaneous motion

5. **Keep opening animations longer than closing**
   - Opening: 400-500ms (leisurely, welcoming)
   - Closing: 200-300ms (snappy, efficient)

6. **Add `pointer-events-none` to hidden elements**
   - Prevents accidental clicks
   - Improves accessibility

7. **Use `origin-bottom` for bottom-anchored elements**
   - Matches the visual expansion direction
   - More intuitive scaling

### ❌ Don'ts

1. **Don't animate too many properties at once**
   - Stick to 2-3 properties max (opacity, scale, translate)
   - Avoid animating width/height with other properties

2. **Don't use equal delays for all elements**
   - Creates robotic feel
   - Vary delays by 50-100ms

3. **Don't make animations too slow**
   - Max 500ms for most animations
   - Users perceive >500ms as sluggish

4. **Don't forget to disable interactions during animation**
   - Use `pointer-events-none` or `disabled` prop
   - Prevents race conditions

5. **Don't use `display: none` for animations**
   - Use opacity and conditional rendering instead
   - `display` changes can't be animated

6. **Don't forget mobile performance**
   - Test on slower devices
   - Reduce blur effects if needed
   - Consider `will-change` for complex animations

---

## Performance Optimization

### GPU Acceleration

Prefer these properties (GPU-accelerated):
- `transform` (translate, scale, rotate)
- `opacity`

Avoid these properties (CPU-intensive):
- `width`, `height` (except with `transform: scale`)
- `top`, `left`, `right`, `bottom` (use `transform: translate` instead)
- `margin`, `padding`

### Will-Change Hint

For complex animations, add `will-change`:

```tsx
<div className="will-change-transform will-change-opacity">
  {/* Animated content */}
</div>
```

**Warning:** Only use `will-change` for actively animating elements. Remove it after animation completes.

### Reduce Motion

Respect user preferences:

```tsx
<div className={cn(
  "transition-all ease-out",
  "motion-reduce:transition-none motion-reduce:duration-0",
  isAnimating ? "opacity-100" : "opacity-0"
)} />
```

---

## Testing Checklist

- [ ] Animation plays smoothly on opening
- [ ] Animation plays smoothly on closing
- [ ] No visual "jumps" or flickers
- [ ] Elements don't overlap unexpectedly
- [ ] Backdrop prevents interaction with content behind
- [ ] Rapid open/close doesn't break animation
- [ ] Works on mobile (iOS Safari, Chrome)
- [ ] Works on desktop (Chrome, Firefox, Safari)
- [ ] Respects `prefers-reduced-motion`
- [ ] No console errors or warnings
- [ ] Performance is good on slower devices

---

## Examples in Codebase

### Chatbar Drawer
- **Location:** `src/components/chat/shared/enhanced-drawer.tsx`
- **Pattern:** Expanding panel from bottom with staggered content
- **Complexity:** High (multiple coordinated elements)

### Chat Input Buttons
- **Location:** `src/components/chat/shared/enhanced-chat-input.tsx`
- **Pattern:** Staggered button group with rotation
- **Complexity:** Medium (coordinated with drawer)

---

## Future Enhancements

### Potential Improvements

1. **Spring Physics**
   - Use `framer-motion` springs for more natural motion
   - Better for drag interactions

2. **Gesture Support**
   - Swipe down to close drawer
   - Drag to adjust drawer height

3. **Shared Element Transitions**
   - Morph button into drawer header
   - Seamless view transitions

4. **Micro-interactions**
   - Button hover effects
   - Loading states
   - Success/error feedback

---

## Questions or Issues?

If you encounter animation issues:

1. Check browser DevTools Performance tab
2. Verify z-index stacking
3. Test with `transition-none` to isolate issues
4. Check for conflicting CSS classes
5. Verify state management logic

For questions, contact the development team or refer to:
- [Tailwind CSS Transitions](https://tailwindcss.com/docs/transition-property)
- [MDN: CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
