# Issue 3 Case Study: growth chart with recommendation jump

## Request

The issue asks for a standard growth chart that also accounts for a possible jump once recommendation systems understand which listeners should receive the artist's releases.

## Data collected

| Topic | Finding | How it affects the product |
| --- | --- | --- |
| Release Radar | Spotify says followers receive pitched songs in Release Radar, and Release Radar also includes artists a listener already follows, listens to, or may like. | The app treats pre-release pitching and follower signals as early inputs to algorithmic distribution. |
| Discovery Mode | Spotify for Artists reports average lifts for selected songs in monthly playlist adds, saves, and listeners during Discovery Mode. | The chart includes an optional recommendation jump rather than a purely linear or smooth compound curve. |
| Royalty market scale | Spotify Loud & Clear 2025 data shows more independent and international income, with many artists earning meaningful royalties without being household names. | The model keeps the target modest and focuses on repeatable fan discovery rather than viral-only assumptions. |
| Artist tools | Spotify Canvas, Clips, profile quality, and pitch metadata are surfaced by Spotify as artist-side tools that can increase engagement signals. | The checklist assigns points to actions that improve classification, saves, shares, and repeat listening. |

## Model

The shipped chart compares two 36-month curves:

- Standard growth starts with 120 monthly listeners and compounds at 8% per month.
- Optimized growth moves toward 11.5% per month as checklist progress improves.
- The recommendation jump happens in month 14 and scales up to 1.85x when the checklist is complete.

The curve is intentionally a planning model, not a guaranteed forecast. It visualizes the issue's core hypothesis: consistent release work creates enough metadata, saves, follows, and listening history for recommendation systems to classify the artist and route tracks to better-fit listeners.

## Solution options considered

| Option | Pros | Cons | Decision |
| --- | --- | --- | --- |
| Static explanatory image | Fast and simple. | Does not react to checklist progress. | Rejected. |
| Chart.js or another chart library | Rich chart features. | Adds dependency weight to a dependency-free static app. | Rejected for this MVP. |
| Inline SVG generated from a pure model | Testable, responsive, dependency-free, and tied to game progress. | Less interactive than a full charting library. | Implemented. |

## Implementation notes

- `GROWTH_MODEL` in `data.js` stores chart assumptions.
- `calculateGrowthCurve` in `app.js` returns standard and optimized monthly listener values.
- The SVG chart is rerendered when checklist progress changes.
- `tests/progress.test.js` verifies the recommendation scenario diverges from the standard curve after the jump month.

## Sources

- Spotify Support: Getting music on Release Radar, https://support.spotify.com/us/artists/article/getting-music-on-release-radar/
- Spotify for Artists: Discovery Mode, https://artists.spotify.com/en/discovery-mode
- Spotify Loud & Clear 2025, https://loudandclear.byspotify.com/
- Spotify Loud & Clear takeaways, https://loudandclear.byspotify.com/takeaways/
