# BlitzTap: Game Design & Vibe Coding Spec

## Overview

BlitzTap is a speed reaction color/shape matching game built with React Native and Expo. Players match a target to a grid of options under escalating time pressure. One mistake ends the round. Short rounds (15 to 45 seconds) create intense replay loops and frequent natural ad break points.

## Core Game Loop

1. **READY** → 3 second countdown with pulsing animation
2. **PLAY** → Target appears at top, grid of options below. Tap the match.
3. **CORRECT** → Satisfying feedback (haptic + visual flash + sound), timer speeds up, next target appears instantly
4. **MISS or TIMEOUT** → Screen shake, "Game Over" overlay with final score
5. **RESULTS** → Show score, personal best comparison, streak stats, coins earned
6. **AD BREAK** → Interstitial ad (skip for first 2 rounds of a session to build engagement)
7. **PLAY AGAIN** → One tap restart, no friction

## Game Mechanics

### Matching System

The game progresses through difficulty tiers that unlock as the player's score increases within a single round:

**Tier 1 (Score 0 to 9): Color Match**
Target shows a solid color. Grid shows 4 colored circles. Tap the matching color.
Colors: Red, Blue, Green, Yellow (high contrast, accessible)

**Tier 2 (Score 10 to 24): Shape Match**  
Target shows a colored shape. Grid shows 6 items. Now players must match BOTH color AND shape.
Shapes: Circle, Square, Triangle, Diamond

**Tier 3 (Score 25 to 49): Pattern Match**
Grid expands to 9 items. Distractors include same color/different shape AND same shape/different color.
Timer is noticeably faster.

**Tier 4 (Score 50+): Chaos Mode**
Grid is 12 items. Shapes may rotate or pulse. Timer is very fast.
Only the most skilled players reach this tier, creating aspirational replay motivation.

### Timer System

Each tap starts a countdown timer. The timer gets shorter as score increases:

| Score Range | Time Per Tap | Grid Size |
|------------|-------------|-----------|
| 0 to 9     | 3.0 seconds | 4 (2x2)  |
| 10 to 24   | 2.2 seconds | 6 (3x2)  |
| 25 to 49   | 1.6 seconds | 9 (3x3)  |
| 50+        | 1.2 seconds | 12 (4x3) |

Timer is displayed as a shrinking bar at the top of the screen, changing color from green to yellow to red.

### Scoring

**Base points:** 1 point per correct tap
**Streak multiplier:** Consecutive correct taps build a multiplier
  Streak of 5 = 2x, Streak of 10 = 3x, Streak of 20 = 5x
**Final Score** = Sum of (base_points × current_multiplier) for each tap

### Coins (Scaffolded for Future Monetization)

Players earn coins each round:
  10 coins per round played (participation reward)
  1 coin per correct tap
  Bonus: 50 coins for beating personal best
  Bonus: 25 coins for streak of 10+

Coins are displayed prominently but NOT spendable in MVP. This builds the accumulation habit.
Show a "Shop Coming Soon" teaser in the coin display area.

## Monetization Strategy (MVP)

### Interstitial Ads

Provider: Google AdMob via expo-ads-admob or react-native-google-mobile-ads
Timing: Show after every round EXCEPT the first 2 rounds of each session
Preloading: Always have the next interstitial preloaded. Start loading immediately when a round begins.
Frequency cap: Maximum 1 interstitial per 60 seconds (prevents user frustration if rounds are very short)

### Rewarded Video Ads

Offer: "Watch a video to continue your streak!" shown on Game Over screen
Benefit: Player gets to continue from where they left off with their streak intact
Limit: 1 continue per round (prevents infinite games)
This is OPTIONAL for the player and should feel like a gift, not a requirement

### Remove Ads (In App Purchase)

Price: $3.99 lifetime (one time purchase)
What it removes: Interstitial ads between rounds
What it keeps: Rewarded video option (since that's player initiated and beneficial)
Implementation: Use react-native-purchases (RevenueCat) for purchase management
RevenueCat handles receipt validation, restore purchases, and entitlement checking
Create a "remove_ads" entitlement in the RevenueCat dashboard
Check entitlement status on app launch to determine ad visibility
No need to manually store purchase state, RevenueCat tracks it server side

## Technical Architecture

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native + Expo (managed workflow) |
| Navigation | expo-router |
| State Management | React Context + useReducer for game state |
| Animations | react-native-reanimated |
| Haptics | expo-haptics |
| Audio | expo-av |
| Ads | react-native-google-mobile-ads |
| IAP | react-native-purchases (RevenueCat) |
| Storage | @react-native-async-storage/async-storage |
| Analytics | expo-firebase-analytics (optional for MVP) |

### Project Structure

```
blitztap/
├── app/
│   ├── _layout.tsx              # Root layout with ad provider
│   ├── index.tsx                # Home/menu screen
│   ├── game.tsx                 # Main game screen
│   └── settings.tsx             # Settings (sound, haptics, restore purchases)
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx        # Grid of tappable options
│   │   ├── TargetDisplay.tsx    # Shows current target to match
│   │   ├── TimerBar.tsx         # Animated countdown bar
│   │   ├── ScoreDisplay.tsx     # Current score + streak multiplier
│   │   ├── GameOverOverlay.tsx  # Results + play again + rewarded ad offer
│   │   └── CountdownReady.tsx   # 3, 2, 1 countdown before round starts
│   ├── shapes/
│   │   ├── Circle.tsx
│   │   ├── Square.tsx
│   │   ├── Triangle.tsx
│   │   └── Diamond.tsx
│   └── ui/
│       ├── CoinDisplay.tsx      # Persistent coin counter
│       ├── Button.tsx
│       └── AdBanner.tsx         # Optional banner ad on menu screen
├── contexts/
│   ├── GameContext.tsx           # Game state (score, streak, tier, coins)
│   └── PurchaseContext.tsx       # RevenueCat entitlement state (ad removal)
├── hooks/
│   ├── useGameEngine.ts         # Core game logic (timer, matching, scoring)
│   ├── useAds.ts                # Ad loading, showing, reward handling
│   ├── useHaptics.ts            # Haptic feedback patterns
│   └── useSound.ts              # Sound effect management
├── utils/
│   ├── levelGenerator.ts        # Generates target + grid options per difficulty
│   ├── scoring.ts               # Score calculation + streak logic
│   ├── storage.ts               # AsyncStorage helpers (high scores, coins, purchases)
│   └── colors.ts                # Color palette constants
├── assets/
│   ├── sounds/
│   │   ├── correct.mp3
│   │   ├── wrong.mp3
│   │   ├── levelup.mp3
│   │   └── countdown.mp3
│   └── images/
│       └── icon.png
├── app.json
├── package.json
└── tsconfig.json
```

### Core Game State

```typescript
interface GameState {
  status: 'idle' | 'countdown' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  streak: number;
  multiplier: number;
  tier: 1 | 2 | 3 | 4;
  timeRemaining: number;
  timePerTap: number;
  gridSize: number;
  target: Target;
  options: Option[];
  totalCoins: number;
  roundCoins: number;
  roundsPlayedThisSession: number;
  adsRemoved: boolean;
}

interface Target {
  color: string;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond';
}

interface Option {
  id: string;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  isCorrect: boolean;
}
```

### Key Implementation Notes

**Timer precision:** Use `react-native-reanimated`'s `useSharedValue` and `withTiming` for smooth timer animations. Do NOT use `setInterval` for the game timer as it will drift and stutter. Instead, record the start timestamp and compute remaining time from `Date.now()`.

**Grid generation:** When generating options, ensure exactly ONE correct answer exists. For higher tiers, deliberately include "near miss" distractors (same color wrong shape, or same shape wrong color) to increase difficulty.

**Haptic patterns:**
  Correct tap: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
  Wrong tap: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`
  New high score: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`

**Ad preloading flow:**
  0. On app launch, initialize RevenueCat and check "remove_ads" entitlement. If active, skip all ad logic.
  1. On app launch, request interstitial load
  2. On round start, check if interstitial is loaded. If not, start loading.
  3. On round end, if interstitial is loaded AND session round count > 2 AND 60+ seconds since last ad, show it.
  4. Immediately start loading next interstitial after showing one.
  5. For rewarded ads, load on game over screen mount. (Rewarded ads still show even for "remove_ads" purchasers since they are player initiated and beneficial.)

**Sound effects:** Keep all sound files under 100KB each. Use short, punchy sounds. Preload all sounds on app mount using `Audio.Sound.createAsync()`.

## Visual Design Direction

### Color Palette

Background: Dark (#1A1A2E or #0F0F23) for contrast and "gamer" feel
Primary accent: Electric blue (#00D4FF)
Success: Bright green (#00FF88)
Error: Hot pink/red (#FF3366)
Timer warning: Amber (#FFB800)
Game piece colors: Saturated, high contrast
  Red: #FF4444
  Blue: #4488FF  
  Green: #44DD44
  Yellow: #FFDD44
  Purple: #AA44FF (Tier 3+)
  Orange: #FF8844 (Tier 4)

### Animations to Implement

Correct tap: Option briefly scales up 1.2x with a bright flash, then fades
Wrong tap: Screen border flashes red, slight shake animation
Timer running low: Timer bar pulses, screen edges subtly glow red
Tier transition: Brief "LEVEL UP" text animation between taps
Score increment: Number "pops" up from the old value
Streak counter: Fire emoji animation at streak milestones (5, 10, 20)
Game Over: Score counts up dramatically, confetti if new high score

### Typography

Use a bold, clean sans serif font. System font is fine for MVP.
Score display: Large, bold, monospaced (for stable width during number changes)
Streak text: Slightly smaller, accent colored

## Sound Design Notes

Keep it minimal and satisfying:
  Correct tap: Short, bright "ding" or "pop" (think bubble pop)
  Wrong tap: Low, short "buzz" or "thud"
  Tier transition: Rising musical tone
  Countdown: 3 subtle ticks, then a "go!" sound
  New high score: Celebration jingle (under 2 seconds)

Users should be able to toggle sound independently of haptics in settings.

## App Store Preparation Checklist

| Item | Details |
|------|---------|
| App Name | BlitzTap (or similar, check availability) |
| Subtitle | Speed Matching Challenge |
| Category | Games > Puzzle (or Games > Trivia) |
| Age Rating | 4+ (contains ads) |
| Privacy | Collects: advertising identifier. No user accounts needed for MVP. |
| Screenshots | 3 to 5 showing gameplay, high score, tier transitions |
| App Icon | Bold, colorful, shows a finger tap and colored shapes |
| Keywords | reaction game, speed match, color match, brain game, reflex test |

## Revenue Projections (Conservative Estimates)

Assumptions: 100 DAU, 5 sessions/day, 8 rounds/session, 6 interstitials/session

Interstitial eCPM (US): ~$10 to $15
Daily interstitial impressions: 100 × 6 = 600
Daily interstitial revenue: $6 to $9

Rewarded video eCPM: ~$30 to $50
Assuming 20% of game overs trigger a rewarded view: ~160/day
Daily rewarded revenue: $4.80 to $8

IAP (remove ads): Assume 2% conversion at $3.99
Per 100 users: ~$8 one time

**Total daily revenue estimate at 100 DAU: $10 to $17/day**
Scale linearly. At 1,000 DAU: $100 to $170/day.

## Vibe Coding Prompt Strategy

When working with Opus 4.6, break the build into these phases:

**Phase 1: Core Game Engine**
"Build the game board, target display, timer, and tap handling. No ads, no sound, no animations yet. Just the core loop: show target, show grid, handle tap, track score, game over on miss."

**Phase 2: Visual Polish**
"Add animations using react-native-reanimated: correct tap flash, wrong tap shake, timer bar color transitions, score pop animation, countdown screen."

**Phase 3: Sound and Haptics**
"Add haptic feedback and sound effects. Preload sounds on mount. Toggle in settings."

**Phase 4: Monetization**
"Integrate react-native-google-mobile-ads for interstitials and rewarded videos. Add RevenueCat (react-native-purchases) for the remove ads purchase. Initialize RevenueCat on app launch, check the 'remove_ads' entitlement to determine if ads should show. Implement the ad timing logic (skip first 2 rounds, 60s minimum gap, preloading)."

**Phase 5: Polish and Ship**
"Add home screen, settings, high score persistence, coin tracking, app icon, splash screen. Prepare for App Store submission."
