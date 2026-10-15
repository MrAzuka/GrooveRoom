<!--
Architecture B sections for ARCHITECTURE.md (hardware, database, authentication, AI features).
Status key: Proposed = my recommendation, needs a team vote. Open = waiting on a decision.
These sections assume the team uses React Native with Expo (Member 2's framework section).
-->

## Hardware integrations

### Audio output and playback

- **Decision:** play audio with `expo-audio`, through the speaker or connected headphones.
- **Alternatives considered:** the older `expo-av` audio API.
- **Reason:** it is Expo's current audio library and is included in Expo Go.
- **Status:** Proposed.

### Background playback and lock-screen controls

- **Decision:** keep music playing with the screen off. Set `shouldPlayInBackground: true` in `setAudioModeAsync`, keep the `enableBackgroundPlayback` plugin option on, and show play, pause and skip in the notification with `setActiveForLockScreen`.
- **Alternatives considered:** foreground-only playback, where music stops when the app is minimized.
- **Reason:** the Playback epic requires music to keep playing in the background. On Android, Expo's docs say audio stops after about 3 minutes in the background unless lock-screen controls are enabled, so the controls are required, not optional. `setActiveForLockScreen` also needs `interruptionMode: 'doNotMix'`.
- **Risk:** config plugin changes only take effect in a new app build, so this may need a development build instead of Expo Go. Test it early.
- **Status:** Proposed.

### Volume, headphones and interruptions

- **Decision:** an in-app volume slider sets the player's volume, and the phone's own volume buttons still work. `interruptionMode: 'doNotMix'` makes other apps pause while SIDE A plays. Per Expo's docs, audio stops when headphones or Bluetooth are disconnected.
- **Alternatives considered:** the hardware buttons only, with no slider.
- **Reason:** the assignment brief names volume control, and a slider gives a visible control on screen.
- **Open question:** whether playback should resume after an interruption such as a phone call.
- **Status:** Proposed.

### Optional extras

- **Decision:** haptic feedback on play and pause (`expo-haptics`), and fingerprint login (`expo-local-authentication`) as stretch goals only.
- **Status:** Optional, not committed.

## Database

- **Decision:** Supabase (Postgres) holds all user data.
- **Alternatives considered:** Firebase Firestore, MongoDB Atlas with a Node.js API, and a local-only database on the phone.
- **Reason:** playlists contain ordered tracks, which fits relational tables. Authentication comes in the same project. Row-level security makes sure users only see their own data. There is a free tier, and no separate API server has to be hosted while the project is marked. A cloud database is also needed so a playlist appears when the user logs in on another device.
- **Trade-off:** the free tier has limits (check them when the project is created), and the app needs a connection. Offline use is not covered in the first version.
- **Draft tables:**

| Table | Holds |
| --- | --- |
| `profiles` | user id, display name |
| `tracks` | id, title, artist, genre and tags, audio URL, artwork URL |
| `library_items` | user id, track id, favourite flag, tags, date added |
| `playlists` | id, user id, name, created date |
| `playlist_tracks` | playlist id, track id, position |
| `listening_history` | user id, track id, played at |
| `track_feedback` | user id, track id, liked or dismissed |

- **Status:** Open until the team votes on the backend. Where the `tracks` rows come from depends on the audio-source decision.

## Authentication

- **Decision:** email and password with Supabase Auth: register, log in, log out, and reset a forgotten password through an emailed link. The session is kept in secure storage on the phone (`expo-secure-store`).
- **Alternatives considered:** Firebase Auth, and a custom login on a Node.js API.
- **Reason:** the hosted service handles password hashing and the reset email. A custom login would mean building both, and the three Account access stories need them.
- **Optional:** fingerprint re-login as a stretch goal.
- **Status:** Open. It follows the backend vote.

## AI features

- **Decision:** recommend songs from the user's listening history in two layers.
  1. **Baseline, rule-based:** suggest tracks that share a genre, tag or artist with songs the user liked or plays often, and leave out anything they dismissed. Like and dismiss feedback adjusts future suggestions.
  2. **Optional, LLM-based:** a "describe a mood, get a playlist" feature, added only if the instructor says the rule-based version does not count as AI. The API key would live on the server (for example in a Supabase Edge Function), never inside the app.
- **Alternatives considered:** Spotify's recommendations, which are closed to apps registered after Nov 27, 2024. A trained model on track data, which is too much work for this scope.
- **Reason:** the baseline works with any music source that provides genre or tags, and it needs no paid service. The assignment requires the app to be free, so an LLM feature is dropped if it has no free tier.
- **Note:** listening stats (top artists and genres) are plain counting, not AI.
- **Status:** Open. Confirm with the instructor what counts as an AI feature.
