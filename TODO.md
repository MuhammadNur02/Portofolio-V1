# Implementation Todo: Mini Game & Visual Adjustments

## Step 1: Create SpaceGame.jsx
- [x] Create new component `src/components/SpaceGame.jsx`
  - Canvas game engine with plane, meteors, bullets, particles ✅
  - Mouse/touch controls ✅
  - Game over logic with Play Again / Close buttons ✅

## Step 2: Update Home.jsx — Add Play Game Button & Game Toggle
- [x] Add "Play Game" button next to Contact button ✅
- [x] Add `isPlaying` state ✅
- [x] Animate GIF illustration out / game in when playing ✅
- [x] Animate game out / GIF illustration in when closed ✅
- [x] Remove blackhole aura rings from ProfilePhoto ✅

## Step 3: Update Background.jsx — Remove Blackhole Suction
- [x] Remove blackhole center tracking (`findProfilePhoto`) ✅
- [x] Remove velocity suction logic on stars ✅
- [x] Keep simple star twinkle + gentle floating motion ✅
- [x] Keep galaxy ambient glow (centered on canvas center) ✅

## Step 4: Update TentacleCanvas.jsx — Scroll-Based Hide
- [x] Add scroll listener to detect when past Portfolio section ✅
- [x] Fade out tentacles (opacity) when scrolled past ✅
- [x] Fade back in when scrolled back up ✅
- [x] Use scroll position check + smooth opacity transition ✅

## Step 5: Verify & Test
- [ ] Run build/dev server to verify no errors
- [ ] Ensure no layout shifts
- [ ] Verify all changes work together
