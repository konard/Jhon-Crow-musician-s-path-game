# Issue 5 Case Study: Recurring Loops

## Request

Issue 5 asks for timers, or loops, for musician growth tasks. The default behavior should enable a checkbox named "Обнулять повторяющиеся задачи". When enabled, regular tasks return to an unfinished state after their cycle expires, while accumulated progress remains partially preserved so the model stays realistic.

## Official Data Used

- Spotify for Artists says a pitched song submitted at least 7 days before release day is included in followers' Release Radar playlists: https://support.spotify.com/us/artists/article/pitching-music-to-playlist-editors/
- Spotify Release Radar updates every Friday and includes new music from followed, listened-to, and recommended artists: https://support.spotify.com/us/artists/article/getting-music-on-release-radar/
- Spotify reports that Canvas is a 3-8 second looping visual and that tracks with Canvas are saved or playlisted over 4x more often on average in the Now Playing view: https://artists.spotify.com/blog/release-guide-preparing-for-release-day
- Spotify's Canvas metrics guide reports high-quality Canvas can increase streams, saves, profile visits, and shares: https://artists.spotify.com/blog/canvas-metrics-guide
- YouTube states an Official Artist Channel brings subscribers and content from different YouTube channels into one place and gives access to artist tools: https://support.google.com/youtube/answer/7336634
- YouTube says Official Artist Channel analytics consolidate data across channels where the artist's music resides: https://support.google.com/youtube/answer/9048215
- TuneCore describes Sync as a creative pitching and licensing service for eligible Publishing Administration clients distributing through TuneCore: https://support.tunecore.com/hc/en-us/articles/360059321671-What-is-TuneCore-Sync

## Product Interpretation

Recurring work should be modeled as state transitions rather than active timers. The app is static and local-first, so background intervals would waste browser work and would not run while the page is closed. The implemented approach checks due loops when the app loads and when the user changes the form. This gives the same user-visible result without continuous polling.

The following tasks are recurring:

- Precise metadata: 90 days, because metadata quality should be revisited across release cycles rather than daily.
- Canvas upload: 30 days, because visual assets are release-linked and Spotify describes Canvas as changeable over time.
- YouTube Shorts: 7 days, because Shorts are a weekly content routine in the checklist.
- Release cadence: 28 days, matching the existing 3-4 week cadence item.
- SoundCloud routine: 7 days, matching the existing weekly routine text.

## Solution Options Considered

- `setInterval` or live countdowns: rejected for this MVP because they spend CPU while the app is open and do nothing while it is closed.
- Service worker alarms: rejected because the app does not currently install a service worker and the feature does not need offline notifications.
- Date-difference checks on load/change: selected because it is deterministic, cheap, testable in Node, and compatible with static hosting.
- External date libraries such as date-fns: rejected because the required calculation is a simple day interval and the repository has no dependencies.

## Implemented Behavior

- A default-on checkbox appears in the top controls.
- Completed recurring tasks store their completion timestamp.
- If loop reset is enabled and a completed recurring task is past its interval, it becomes unchecked.
- A reset loop keeps 60% of the task points as retained progress, capped at the original task value.
- Retained points contribute to dashboard progress but do not mark the task complete.
- Manual reset clears completed tasks, retained loop points, and settings back to defaults.

## Verification

Automated tests cover:

- Existing progress math.
- State loading and persistence with the new fields.
- Overdue loop reset behavior.
- Disabled loop reset behavior.
- Retained loop point contribution.
