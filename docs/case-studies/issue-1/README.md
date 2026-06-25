# Issue 1 case study: MVP web version

## Request

Issue #1 asks for the first web version of a gamified checklist for an independent instrumental electronic musician. The app must persist progress in `localStorage`, prepare for GitHub Pages deployment, and use the provided release-growth data as the core gameplay model.

## Source data from the issue

The issue groups actions into four practical phases:

- Pre-release: Spotify for Artists pitch, precise distributor metadata, presave smart link, and scheduling the release 4-6 weeks ahead.
- Release week: Canvas, Clips, owned playlists, and YouTube Shorts.
- Cadence and format: 3-4 week release cadence, 4-5 track EPs, shorter albums, album tail protection, and a 70/20/10 EP/single/album mix.
- External platforms: SoundCloud routine, YouTube Official Artist Channel, and TuneCore Sync submissions.

The issue estimates the strategic effect as a reduction from roughly 5-7 years to 3.5-4.5 years to reach 20,000 RUB/month, or about 1.6-2x acceleration.

## Additional research

- Spotify says artists can pitch upcoming unreleased songs through Spotify for Artists. Spotify also says that pitching before release can place the pitched song in followers' Release Radar, with Spotify support mentioning at least 7 days and Spotify's release guide recommending two weeks.
- Spotify's Canvas metrics guide reports that a high-quality Canvas has increased streams and saves in observed cases, and frames Canvas as a way to improve listener engagement.
- Spotify describes Clips as short, under-30-second vertical videos that let artists add release context while keeping music central.
- TuneCore describes TuneCore Sync as a pitching and licensing service for TuneCore Publishing Administration clients who also distribute through TuneCore.

Sources:

- https://support.spotify.com/us/artists/article/pitching-music-to-playlist-editors/
- https://artists.spotify.com/en/new-releases
- https://artists.spotify.com/en/blog/canvas-metrics-guide
- https://artists.spotify.com/en/video/how-artists-are-using-spotify-clips
- https://support.tunecore.com/hc/en-us/articles/360059321671-What-is-TuneCore-Sync

## Product analysis

The best first version is not a full simulation game. The provided data is already checklist-shaped, and the highest-value MVP is a persistent planning surface that turns each action into points, estimated impact, and timeline change. This lets the musician understand which actions are done, which are still missing, and how the forecast changes as work is completed.

The model uses a conservative linear interpolation:

- 0% completion: 1.0x acceleration and 5-7 years to the income target.
- 100% completion: 2.0x acceleration and 3.5-4.5 years to the income target.
- Each action has a point weight based on the issue's own recommended weighting pattern and the relative size of the estimated impact.

This avoids overclaiming precision while still making the checklist feel measurable.

## Existing components and libraries considered

- React/Vite would speed future componentization, but it adds a build chain and deployment complexity that the repository does not currently need.
- Alpine.js could provide declarative state in static HTML, but the required state and calculations are small enough for plain JavaScript.
- localForage or IndexedDB wrappers are unnecessary because the app stores only a compact checklist and one numeric goal.
- Chart.js could visualize progress later, but the MVP only needs stable dashboard metrics and a progress bar.

## Implemented solution

- Static GitHub Pages-ready app: `index.html`, `styles.css`, `data.js`, and `app.js`.
- Weighted release-action checklist with grouped phases and estimated impact labels.
- Persistent progress and income goal using `localStorage`.
- Forecast dashboard for points, timeline, and acceleration coefficient.
- Node-based test covering scoring and storage fallback behavior.
- GitHub Actions workflow that runs tests and deploys Pages from `main`.

## Reproduction and verification

Run:

```bash
npm test
```

Open `index.html` in a browser. Check actions, reload the page, and verify that completed actions and the goal remain saved.
