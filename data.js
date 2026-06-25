const ACTIONS = [
  {
    id: "spotify-pitch",
    phase: "Pre-release",
    title: "Pitch through Spotify for Artists",
    points: 30,
    upliftMin: 20,
    upliftMax: 30,
    horizon: "First 4 weeks",
    description: "Choose the focus track, tags, moods, instrumentation, and a concise story for the editorial pitch.",
    source: "Issue estimate; Spotify confirms pitched tracks can enter followers' Release Radar when submitted ahead of release."
  },
  {
    id: "metadata",
    phase: "Pre-release",
    title: "Precise TuneCore metadata",
    points: 18,
    upliftMin: 10,
    upliftMax: 20,
    horizon: "Ongoing",
    recurrenceDays: 90,
    description: "Use a narrow subgenre, 2-3 moods, and instrumental metadata so recommendation systems classify the release cleanly.",
    source: "Issue estimate."
  },
  {
    id: "presave",
    phase: "Pre-release",
    title: "Publish and share a presave smart link",
    points: 22,
    upliftMin: 15,
    upliftMax: 25,
    horizon: "Release week",
    description: "Collect the first 10-20 saves before launch to give Release Radar and early listeners a stronger signal.",
    source: "Issue estimate."
  },
  {
    id: "release-window",
    phase: "Pre-release",
    title: "Schedule release 4-6 weeks ahead",
    points: 24,
    upliftMin: 0,
    upliftMax: 0,
    horizon: "Planning gate",
    description: "Leave enough lead time for pitching, presaves, visual assets, playlist prep, and external content.",
    source: "Issue requirement."
  },
  {
    id: "canvas",
    phase: "Release week",
    title: "Upload Canvas for each track",
    points: 10,
    upliftMin: 2,
    upliftMax: 10,
    horizon: "Ongoing",
    recurrenceDays: 30,
    description: "Add short looping visual assets to improve save, share, and profile engagement signals.",
    source: "Issue estimate; Spotify reports high-quality Canvas can lift streams, saves, profile visits, and shares."
  },
  {
    id: "clips",
    phase: "Release week",
    title: "Upload Spotify Clips",
    points: 15,
    upliftMin: 10,
    upliftMax: 15,
    horizon: "1-2 weeks",
    description: "Publish short vertical videos around the release so fans see context on Spotify surfaces.",
    source: "Issue estimate; Spotify describes Clips as under-30-second vertical videos for artists."
  },
  {
    id: "owned-playlists",
    phase: "Release week",
    title: "Add tracks to owned playlists",
    points: 12,
    upliftMin: 0,
    upliftMax: 0,
    horizon: "Cumulative",
    description: "Place 1-2 tracks in relevant owned playlists with at least 30 followers to seed guaranteed listening.",
    source: "Issue estimate."
  },
  {
    id: "youtube-shorts",
    phase: "Release week",
    title: "Publish YouTube Shorts",
    points: 8,
    upliftMin: 0,
    upliftMax: 0,
    horizon: "Long tail",
    recurrenceDays: 7,
    description: "Post track fragments with links to reach listeners outside Spotify and recycle release assets.",
    source: "Issue estimate."
  },
  {
    id: "release-cadence",
    phase: "Cadence",
    title: "Release every 3-4 weeks",
    points: 50,
    upliftMin: 40,
    upliftMax: 60,
    horizon: "After 2-3 cycles",
    recurrenceDays: 28,
    description: "Maintain a repeatable schedule instead of weekly drops or long gaps.",
    source: "Issue estimate."
  },
  {
    id: "ep-format",
    phase: "Cadence",
    title: "Prefer 4-5 track EPs",
    points: 25,
    upliftMin: 25,
    upliftMax: 30,
    horizon: "First week and tail",
    description: "Use EPs as the default format to balance playlistability, listener completion, and production effort.",
    source: "Issue estimate."
  },
  {
    id: "album-size",
    phase: "Cadence",
    title: "Keep albums to 8-10 tracks",
    points: 18,
    upliftMin: 0,
    upliftMax: 0,
    horizon: "Long-term",
    description: "Avoid overlong albums so completion rate stays high enough to support recommendation signals.",
    source: "Issue estimate."
  },
  {
    id: "album-tail",
    phase: "Cadence",
    title: "Leave 4-6 weeks after an album",
    points: 18,
    upliftMin: 30,
    upliftMax: 40,
    horizon: "First 4-6 weeks after album",
    description: "Do not cut off the album tail with another release too quickly.",
    source: "Issue estimate."
  },
  {
    id: "format-mix",
    phase: "Cadence",
    title: "Use 70% EP, 20% single, 10% album mix",
    points: 16,
    upliftMin: 0,
    upliftMax: 0,
    horizon: "12+ months",
    description: "Plan a yearly portfolio that keeps retention steady while reserving albums for milestones.",
    source: "Issue estimate."
  },
  {
    id: "soundcloud",
    phase: "External",
    title: "Maintain SoundCloud routine",
    points: 10,
    upliftMin: 5,
    upliftMax: 15,
    horizon: "Ongoing",
    recurrenceDays: 7,
    description: "Upload releases, join 2-3 genre groups, post weekly, and listen to related artists.",
    source: "Issue estimate."
  },
  {
    id: "youtube-oac",
    phase: "External",
    title: "Use YouTube Official Artist Channel",
    points: 15,
    upliftMin: 0,
    upliftMax: 40,
    horizon: "Viral upside",
    description: "Unify the YouTube catalog and publish Shorts so tracks can travel through user-generated video.",
    source: "Issue estimate."
  },
  {
    id: "sync",
    phase: "External",
    title: "Submit tracks to TuneCore Sync",
    points: 8,
    upliftMin: 0,
    upliftMax: 0,
    horizon: "Placement-based",
    description: "Pitch tracks for licensing opportunities; this affects income more directly than streams.",
    source: "Issue estimate; TuneCore describes Sync as a pitching and licensing service."
  }
];

const BASELINE_YEARS = { min: 5, max: 7 };
const OPTIMIZED_YEARS = { min: 3.5, max: 4.5 };

if (typeof module !== "undefined") {
  module.exports = { ACTIONS, BASELINE_YEARS, OPTIMIZED_YEARS };
}
