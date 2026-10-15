# SIDE A — Architecture

> **Status:** Draft v1 for Phase 1 · **Last updated:** 2026-10-15
> **Architecture A (this draft):** Sophia Perez — framework, dependencies, Android target, navigation, repo setup, Playback epic
> **Architecture B:** Ebube Okutalukwe — hardware, database, authentication, AI features (sections marked *To be completed by Architecture B*)
> Any change to a decision goes through a pull request, and the record is updated with the reason (Team Charter, Decision-making).

SIDE A is a free, ad-free Android music player with a turntable-style player, a "record shelf" library, and three tabs (Listen, Collection, Search). Users register, build a library and playlists, play music (including with the screen off) and get song suggestions.

---

## 1. Summary

| Area | Decision | Record | Owner |
|---|---|---|---|
| Development framework | React Native with Expo, TypeScript | A1 | Sophia Perez |
| Target devices | Android phones, portrait only | A2 | Sophia Perez |
| Navigation strategy | Expo Router: 3 bottom tabs, mini-player, Now Playing modal | A3 | Sophia Perez |
| Repo setup | One GitHub repo, protected `main`, one branch per task | A4 | Sophia Perez |
| Project dependencies | See Section 3 | — | Sophia Perez (+ Ebube for backend packages) |
| Playback epic | expo-audio + our own queue, shuffle, repeat and volume logic | A5–A10 | Sophia Perez |
| Hardware integrations | *To be completed by Architecture B* | B1 | Ebube Okutalukwe |
| Database | *To be completed by Architecture B* | B2 | Ebube Okutalukwe |
| Authentication | *To be completed by Architecture B* | B3 | Ebube Okutalukwe |
| AI features | *To be completed by Architecture B* | B4 | Ebube Okutalukwe |

Every Architecture Decision Record below uses the same fields: **User story / need → Context → Decision → Alternatives considered → Consequences → Done when → Owner → Status.**

---

## 2. Architecture A — Foundation

### A1 — Development framework

- **User story / need:** As the team, we need one framework all four of us can build in, test on Android, and explain at marking.
- **Context:** The app must run on Android (charter constraint). The course covers React Native, and the team works in JavaScript. We want every member able to run the app on a phone or emulator in the first week, without each person setting up a full native Android toolchain first.
- **Decision:** **React Native with Expo**, using Expo's TypeScript template.
  - Use the current stable Expo SDK at repo setup (SDK 57 with React Native 0.86 at time of writing, per the [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57)). We don't upgrade the SDK mid-project unless the team votes to.
  - UI work can run in **Expo Go**. Playback testing uses a **development build** (`npx expo run:android`), because background-audio settings only take effect in a built app ([Expo Audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)).
  - Testers install an internal APK; the app is never published to a store (charter constraint).
- **Alternatives considered:**
  - *Bare React Native CLI* — every member would need Android Studio and native config from day one; no planned feature needs it.
  - *Flutter* — uses Dart, which this course doesn't teach.
  - *Ionic / Cordova* — web-view apps; background audio and media controls are weaker.
- **Consequences:** One codebase with hot reload and Expo's maintained modules for audio and UI. TypeScript is Expo's default; we keep types light (mainly the `Track` and player state types) so it catches mistakes without slowing the team down. If a feature later needs a native library, Expo development builds support it without leaving Expo.
- **Done when:** a new Expo project runs on the emulator and on at least one member's phone.
- **Owner:** Sophia Perez · **Status:** Proposed — team vote at next meeting

### A2 — Target devices

- **User story / need:** As a listener with an Android phone, I can install and use SIDE A.
- **Context:** Android is required. The SIDE A wireframe is a phone screen in portrait. The charter's Definition of Done says every task must run on an Android device or emulator.
- **Decision:** **Android phones only, portrait orientation locked** (`"orientation": "portrait"` in `app.json`), using Expo's default minimum Android version.
  Test setup:
  1. Android emulator (Pixel profile, recent Android version) on each developer's machine
  2. At least two members' physical Android phones (charter action item), because background playback must be checked on a real device
- **Alternatives considered:** iOS (not required, and testing needs Apple hardware the team doesn't all have); tablets and landscape (extra layouts nobody will test or mark).
- **Consequences:** Layouts only handle phone widths in portrait. iOS might work through Expo but is not tested or claimed.
- **Done when:** two members confirm a working Android device or emulator on the board.
- **Owner:** Sophia Perez · **Status:** Proposed

### A3 — Navigation strategy

- **User story / need:** As a listener, I can move between Listen, Collection and Search in one tap, and see what's playing from any screen.
- **Context:** The wireframe has three main areas, a full turntable player, and sign-in screens. Music keeps playing while the user browses, so playback controls need to stay visible across tabs.
- **Decision:** **Expo Router** (file-based routing built on React Navigation) with **bottom tabs**, a **persistent mini-player**, and a **full-screen Now Playing modal**.

  ```
  app/
  ├── _layout.tsx            # root: PlayerProvider, mini-player, sign-in redirect
  ├── (auth)/                # sign-in / sign-up screens (details: Architecture B, B3)
  ├── (tabs)/
  │   ├── _layout.tsx        # bottom tab bar
  │   ├── listen.tsx         # home: recently played, suggestions
  │   ├── collection/
  │   │   ├── index.tsx      # record shelf: liked tracks + playlists
  │   │   └── playlist/[id].tsx
  │   └── search.tsx
  └── now-playing.tsx        # full-screen modal: turntable player
  ```

  - **Tabs:** Listen, Collection, Search, matching the wireframe.
  - **Stack inside Collection** for playlist details.
  - **Mini-player** sits above the tab bar in the root layout, so it stays on every tab. Tapping it opens Now Playing.
  - **Now Playing** is a modal: it slides up over the tabs and closes with swipe-down or a back press, leaving the user where they were.
- **Alternatives considered:**
  - *React Navigation set up by hand* — same result with more boilerplate; Expo Router is built on it anyway.
  - *Drawer menu* — hides the three main areas behind a menu, which the wireframe doesn't use.
  - *Now Playing as a fourth tab* — would take the user away from what they were browsing every time they open the player.
- **Consequences:** The `app/` folder is the navigation map, so any member can add a screen by adding a file. Library and Playlists screens (Adrian) and remaining wireframe screens (David, Usability) plug into this structure.
- **Done when:** the app opens to three working tabs, the mini-player shows on each, and Now Playing opens and closes from it.
- **Owner:** Sophia Perez (decision) · David Azuka builds the remaining screens (Usability epic) · **Status:** Proposed

### A4 — Repo setup

- **User story / need:** As a team member, I can clone the repo, run the app, and work on my task without breaking anyone else's work.
- **Context:** The charter requires: no direct commits to `main`, one branch per task, a teammate's review on every pull request, and commits linked to tasks (for example "Closes #12").
- **Decision:**
  - **One GitHub repo**, linked to the team's GitHub Project board.
  - **`main` is protected:** merging needs a pull request with at least one approving review.
  - **Branch per task**, named after its board issue: `feature/12-shuffle`, `fix/18-seek-bar`.
  - **Pull requests** say `Closes #<issue>` so the card moves to Done when merged.
  - **Linting:** ESLint and Prettier through `npx expo lint`, so reviews focus on logic, not formatting.
  - **Secrets:** a `.env.example` lists every key with no values; the real `.env` is in `.gitignore`.
  - **README** lists setup steps: install Node LTS, `npm install`, `npx expo start`, and how to make a development build.
  - **Folders:**
    ```
    app/          screens and navigation (A3)
    components/   shared UI (MiniPlayer, TrackRow, PlayerControls…)
    player/       PlayerProvider, queue/shuffle/repeat logic (A5–A10)
    constants/    theme.ts (colours, spacing, fonts)
    types/        Track and other shared types
    assets/       fonts, icons, any licensed demo audio
    ```
- **Alternatives considered:** a separate `dev` branch (an extra merge step a four-person team doesn't need); committing straight to `main` (breaks the charter).
- **Consequences:** Every change is reviewed and traceable to a card, which also shows each member's work on the board.
- **Done when:** the repo exists, all four members are invited, `main` is protected, and a fresh clone runs by following the README.
- **Owner:** Sophia Perez · **Status:** Proposed

---

## 3. Project dependencies

Installed with `npx expo install` so versions match the Expo SDK. Only packages with a named use are added.

| Package | Used for | Record |
|---|---|---|
| `expo`, `react-native`, `typescript` | Framework | A1 |
| `expo-router` (+ `react-native-screens`, `react-native-safe-area-context`) | Tabs, Collection stack, Now Playing modal | A3 |
| `expo-audio` | Playing tracks, background playback, lock-screen controls | A5–A6 |
| `@react-native-community/slider` | Seek bar and volume slider | A5, A10 |
| `react-native-reanimated` | Spinning record and tonearm on Now Playing | A5 |
| `react-native-gesture-handler` | Swipe-down to close Now Playing | A3 |
| `@expo/vector-icons` | Play, pause, skip, shuffle, repeat, volume icons | All |
| `expo-image` | Cover art with caching and placeholders | A3, A5 |
| `expo-font` | Wireframe typography | All |
| ESLint + Prettier (via `npx expo lint`) | Consistent code for reviews | A4 |
| Jest + React Native Testing Library | Testing queue, shuffle and repeat logic | A7–A9 |
| *Database, authentication and AI packages* | *To be completed by Architecture B* | B2–B4 |

**No extra state library (Redux, Zustand) and no UI kit.** Player state lives in React Context with `useReducer`, which is built into React and covered in the course; it's enough for one player. A UI kit's Material styling would fight the custom turntable look, so we use `StyleSheet` with a shared `theme.ts`.

---

## 4. Architecture A — Playback epic

All playback features share one design: **expo-audio plays one track at a time, and our own `PlayerProvider` decides which track comes next.** Each feature below is a separate record.

**Shared track shape.** The music source is still an open team vote (royalty-free tracks, bundled tracks, or files on the phone; see the charter's Risks table). Playback only ever receives this shape, so it works with whichever source wins, and only a small adapter changes:

```ts
type Track = {
  id: string;
  title: string;
  artist: string;
  artworkUri?: string;
  audioUri: string;      // remote URL or bundled/local file — expo-audio plays both
  durationSec?: number;
};
```

### A5 — Play, pause and seek

- **User story:** As a listener, I can play and pause a track and drag to any point in it, from the mini-player or Now Playing.
- **Context:** This is the core of the app. Controls appear in two places (mini-player and Now Playing), so they must share one source of truth.
- **Decision:**
  - One **`expo-audio` player** created once in `PlayerProvider` (root layout), not per screen, so playback continues while navigating.
  - Play/pause buttons call `player.play()` / `player.pause()`.
  - The seek bar (`@react-native-community/slider`) reads current time and duration from `useAudioPlayerStatus` and calls `player.seekTo(seconds)` when released.
  - The turntable record spins (Reanimated) only while playing.
- **Alternatives considered:**
  - *`expo-av`* — older Expo audio module, replaced by `expo-audio`.
  - *`react-native-track-player`* — strong features but a third-party native module with more setup; kept as a fallback (see A6).
  - *A player per screen* — music would stop or double up when changing screens.
- **Consequences:** Every screen reads the same player state through `usePlayer()`, so the mini-player and Now Playing never disagree.
- **Done when:** a track plays, pauses and seeks from both the mini-player and Now Playing, on an Android device.
- **Owner:** Sophia Perez · **Status:** Proposed

### A6 — Background playback (screen off)

- **User story:** As a listener, I can lock my phone or switch apps and the music keeps playing, with controls on the lock screen.
- **Context:** Listed in the charter's project overview. On Android, the Expo docs say that without lock-screen controls background audio "will stop after approximately 3 minutes" ([Expo Audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)).
- **Decision:**
  - Set the audio mode with `shouldPlayInBackground: true`.
  - Keep the `expo-audio` config plugin's `enableBackgroundPlayback` on (its default), which adds Android's media-playback foreground service.
  - Call `player.setActiveForLockScreen(true, { title, artist, artworkUrl })` whenever a new track starts.
  - Test on a **development build on a physical phone**, not Expo Go.
- **Alternatives considered:** `react-native-track-player`, which has built-in lock-screen next/previous buttons. We switch to it only if testing shows `expo-audio` can't provide the controls we need.
- **Consequences:** Playback works with the screen off using the same module as A5. The lock-screen notification and speaker/headphone handling also belong to hardware integrations (Architecture B, B1); Sophia and Ebube review each other's sections so they match.
- **Done when:** a track keeps playing for more than 5 minutes with the screen locked, and play/pause works from the lock screen.
- **Owner:** Sophia Perez · **Status:** Proposed — needs a test on a real device

### A7 — Queue, next and previous

- **User story:** As a listener, when I tap a song in a playlist or search results, the following songs play after it, and I can skip forward and back.
- **Context:** `expo-audio` plays one source at a time; it has no built-in queue. Shuffle and repeat (A8, A9) both depend on the queue.
- **Decision:** `PlayerProvider` keeps the queue in a `useReducer`:
  ```ts
  { queue: Track[]; originalQueue: Track[]; index: number;
    shuffle: boolean; repeat: 'off' | 'all' | 'one'; volume: number }
  ```
  - Tapping a track loads the whole list it came from and starts at that track.
  - **Next** moves to `index + 1`.
  - **Previous** restarts the current track if more than 3 seconds have played; otherwise it goes to the previous track (the common music-app behaviour).
  - When the status reports the track **finished**, the reducer decides what plays next using the repeat rules in A9.
- **Alternatives considered:** a state library such as Redux or Zustand (not needed for one player); `react-native-track-player`'s built-in queue (see A6).
- **Consequences:** The queue logic is plain functions with no audio code, so it can be unit-tested with Jest.
- **Done when:** next, previous and auto-advance work on a 3+ track list, with unit tests for the reducer.
- **Owner:** Sophia Perez · **Status:** Proposed

### A8 — Shuffle

- **User story:** As a listener, I can turn shuffle on to hear the rest of the list in random order, and turn it off to go back to the original order.
- **Context:** Part of the Playback epic in the charter. Shuffle must not interrupt the song that's already playing.
- **Decision:**
  - **On:** keep the current track playing, and shuffle the remaining tracks with the Fisher–Yates algorithm (every order equally likely). The original order is saved in `originalQueue`.
  - **Off:** restore `originalQueue` and continue from the current track's position in it.
  - Shuffle stays on for the session until the user turns it off.
- **Alternatives considered:** picking a random track each time (repeats songs before others have played); `Array.sort(() => Math.random() - 0.5)` (biased, so some orders come up more than others).
- **Consequences:** No repeats until the whole list has played, and turning shuffle off feels predictable.
- **Done when:** shuffling a 10-track list plays all 10 once with the current track unchanged, and turning it off restores the order. Unit tests cover both.
- **Owner:** Sophia Perez · **Status:** Proposed

### A9 — Repeat

- **User story:** As a listener, I can repeat the whole list or the current song.
- **Context:** Part of the Playback epic in the charter. The repeat mode decides what happens when a track ends, so it works together with A7.
- **Decision:** One repeat button that cycles **Off → All → One**, with a different icon for each.
  | Mode | When a track ends | When the last track ends |
  |---|---|---|
  | Off | Next track | Stop |
  | All | Next track | Back to the first track |
  | One | Same track again | Same track again |
  Pressing **Next** during Repeat One still skips to the next track, so the user is never stuck.
- **Alternatives considered:** two separate buttons (more clutter on the turntable layout); Repeat One also blocking Next (users find that confusing).
- **Consequences:** The rules are a small table in the reducer and easy to test.
- **Done when:** all three modes behave as in the table, with unit tests.
- **Owner:** Sophia Perez · **Status:** Proposed

### A10 — Volume

- **User story:** As a listener, I can change the volume from Now Playing.
- **Context:** Part of the Playback epic in the charter. Android phones also have hardware volume buttons that control the system media volume.
- **Decision:**
  - A **volume slider** on Now Playing sets `player.volume` (0 to 1). This is the app's own playback volume, kept in `PlayerProvider` state so it applies to every track.
  - **Hardware volume buttons** keep controlling the phone's media volume as normal; we don't override them.
- **Alternatives considered:** changing the system volume from the app (needs an extra native library and overrides the phone's own setting); no in-app volume (it's listed in the charter's Playback epic).
- **Consequences:** No extra permissions or libraries. The volume resets to 100% when the app restarts; saving it between sessions can be added later if the team wants it.
- **Done when:** the slider changes loudness smoothly, the setting carries over to the next track, and hardware buttons still work.
- **Owner:** Sophia Perez · **Status:** Proposed

---

## 5. Architecture B

*To be completed by Ebube Okutalukwe (Architecture B), using the same record fields as above.*

- **B1 — Hardware integrations** (speaker/headphones, lock-screen notification; must match A6)
- **B2 — Database**
- **B3 — Authentication** (sign-in screens live in `app/(auth)/`, see A3)
- **B4 — AI features**

---

## 6. Attribution list

Roles come from the Team Charter. Review partners follow the charter: Member 1 with Member 4 (David and Adrian), Member 2 with Member 3 (Sophia and Ebube).

| Work | Responsible | Reviewer |
|---|---|---|
| A1 Framework, A2 Target devices, A3 Navigation, A4 Repo setup | Sophia Perez | Ebube Okutalukwe |
| Section 3 Project dependencies | Sophia Perez (Ebube adds backend packages) | Ebube Okutalukwe |
| A5–A10 Playback epic (play/pause/seek, background, queue, shuffle, repeat, volume) | Sophia Perez | Ebube Okutalukwe |
| B1–B4 Hardware, database, authentication, AI; Account access and Recommendations epics | Ebube Okutalukwe | Sophia Perez |
| Usability epic: building the navigation and remaining wireframe screens on top of A3 | David Azuka | Adrian Lexter Paule |
| Library and Playlists epics, using the `Track` shape and the Collection routes | Adrian Lexter Paule | David Azuka |
| Final check of this file before submission | Adrian Lexter Paule (charter lead) | — |

### Board cards for Architecture A

| Card | Assignee | Definition of Done |
|---|---|---|
| Write A1–A4 and dependencies in ARCHITECTURE.md | Sophia Perez | Merged through a PR reviewed by Ebube |
| Write Playback records A5–A10 | Sophia Perez | Merged through a PR reviewed by Ebube |
| Create repo, protect `main`, invite team, add README and `.env.example` | Sophia Perez | All four members can clone and run the app |
| Initialize Expo app with three tabs, mini-player slot and Now Playing modal | Sophia Perez | Runs on the emulator; tabs and modal open |
| Test background playback on a development build | Sophia Perez | Plays >5 minutes with screen locked on a real phone |

---

## 7. Change log

| Date | Change | By |
|---|---|---|
| 2026-10-15 | Draft v1 of Architecture A (A1–A10) | Sophia Perez |
| _TBD_ | Architecture B sections (B1–B4) | Ebube Okutalukwe |
| _TBD_ | Update the `Track` adapter once the team votes on the music source | Sophia Perez |

## Sources

- [Expo Audio (expo-audio) documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57)
