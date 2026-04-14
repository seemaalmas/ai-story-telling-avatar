# Engagement Roadmap — Making Katha AI Popular

Research-backed recommendations for what to build next so Katha AI becomes
sticky for Indian families and children. Ordered by *impact ÷ effort*.

## Tier 1 — Ship these first (high impact, low-to-medium effort)

### 1. Daily Story Streaks + Push Reminders
- Calendar strip on Home ("5-day streak"), fire-emoji when active.
- Local notification each evening at the child's "story time" (user-set).
- Weekly "streak recap" share card (PNG) for WhatsApp.
- **Why it works:** Streaks are the single biggest retention lever in
  consumer apps (Duolingo, Snapchat). Parents will open daily to keep the
  streak alive for their kid.
- **Build notes:** `expo-notifications` + a `streaks` column on user,
  rolled nightly by the worker.

### 2. Child Profiles + Age-Gated Content
- Up to 4 child profiles per account, each with name, age, avatar.
- Story engine receives `childAge` and adjusts vocabulary + length.
- Parental PIN to switch profiles or access subscription settings.
- **Why it works:** Families pay more readily for shared-account apps
  (Netflix Kids, YouTube Kids pattern) and content that "knows" the child.

### 3. Story Library + Favorites
- Save any generated story; re-play with identical branching.
- Categories: "Bedtime", "Moral", "Mythology", "Funny".
- Offline download of audio + subtitles for plane/long-drive use.
- **Why it works:** Converts a one-shot generator into a growing library
  per household. Offline = parents trust the app for travel.

### 4. WhatsApp-Style Share Cards
- "Today's story: *The Brave Squirrel of Jaipur*" auto-rendered to a
  vertical image (1080x1920) with Katha logo, avatar, opening line.
- One-tap share via `expo-sharing` → WhatsApp / Instagram Story.
- **Why it works:** WhatsApp is the #1 organic growth channel in India.
  Every shared card is a free install.

### 5. Regional Voice Library
- 2 curated voices per language: e.g. "Dadi" (grandmother), "Mama".
- Free tier: 2 voices. Premium: all 20+ voices plus celebrity-style packs.
- **Why it works:** Voice is the emotional hook in audio-first markets.

## Tier 2 — Ship these after Tier 1 validates (medium effort)

### 6. Record-Your-Own-Voice Story
- Parent records 90 seconds; we clone a voice (using any TTS vendor with
  voice cloning — ElevenLabs, PlayHT, etc.) and narrate in *their* voice.
- Strong consent flow + watermarking for ethical compliance.
- **Why it works:** Biggest possible emotional lock-in. "Papa reading to me
  even when he's travelling." Premium-only → justifies the upgrade.

### 7. Interactive Choose-Your-Own-Adventure
- The story engine already supports branching (`StoryChoice` type).
  Surface this in UI: child taps a choice every 30–45 sec, the avatar reacts.
- Haptic feedback on choice tap, tiny animation on avatar.
- **Why it works:** Converts passive listening into active engagement,
  doubles typical session length.

### 8. Learning Mode (Parent-Driven)
- Parent picks a value ("honesty", "sharing", "courage").
- Story is generated around that moral, with a 30-second "reflection"
  at the end: 2 questions the parent can ask the child.
- **Why it works:** Parents need to *justify* screen time. This gives
  them a reason to choose Katha over YouTube.

### 9. Family Multiplayer
- Two devices, one story. A parent + child each get a character; choices
  alternate between them. Works over Bluetooth/local network first, cloud
  later.
- **Why it works:** Turns the app from a babysitter into a family activity
  → higher emotional value, harder to churn.

### 10. Live Avatar Expressions
- Use `AnimationCue` from the story engine to drive lip-sync + expression
  changes on the 2D avatar (Lottie or Rive).
- Subtitle word-highlighting synced to TTS timings.
- **Why it works:** Visual polish is the single biggest driver of App Store
  ratings for kids apps.

## Tier 3 — Network effects (bigger bets)

### 11. Community Story Seeds
- Curated parent-submitted prompts ("Write a story about Diwali where the
  diya is lost"). Moderated by admins.
- Shown as a "Trending today" row on Home.

### 12. School Mode
- B2B: teachers generate a classroom story, 30 students tap choices on
  their devices, majority wins each branch.

### 13. Audio-Only Mode (Alexa / Google Home)
- Android Auto / CarPlay integration for road trips.
- Export stories to Google Assistant Routines.

### 14. Creator Economy
- Verified artists publish custom voice packs and avatars; revenue share.

## UI-level polish (low effort, high perceived quality)

- Skeleton loaders on every list (you already have `<Skeleton />`).
- Haptic feedback on all primary CTAs (`expo-haptics`).
- Shared-element transitions between story card → playing screen.
- Dark mode aware of the child's bedtime window.
- Animated confetti when a child completes their first story.
- Honeycomb-grid story picker on Home (more visual than a list).

## What *not* to build yet

- **Social feed** — moderation cost on kids content is enormous.
- **Chat / DMs between users** — child-safety risk, regulatory landmine.
- **Generative video** — cost per story multiplies 100x, no differentiation.

## Measuring success

Instrument these events from day one:
- `story_started` / `story_completed` / `story_abandoned_at_turn`
- `streak_maintained` / `streak_broken`
- `share_card_generated` / `share_card_sent`
- `paywall_viewed` / `paywall_converted`
- `voice_recorded` (Tier 2)

Target: **D7 retention > 35%**, **share-card-per-DAU > 0.1**, **paid
conversion > 3%** within 90 days of each tier launching.
