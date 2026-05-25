# BeatCam Dance by Niko

BeatCam Dance by Niko is a browser-based webcam dance game. Load a song, turn on the camera, dance on the beat, and score points from body movement instead of fixed choreography.

The game is designed around free movement: you do not have to perform a specific dance. The camera tracks your body, the song is mapped automatically, and the scoring rewards movement that lands near the beat.

## Install and run locally

BeatCam Dance by Niko is a static browser app. There is no `npm install` or build step. To "install" it, put the project folder anywhere on your computer, such as `Desktop`, `Documents`, or a development folder.

### Option 1: Clone with Git

If you have Git installed, open Terminal or Command Prompt and run:

```bash
git clone https://github.com/Niko2756/beatcam-dance-by-niko.git
cd beatcam-dance-by-niko
```

### Option 2: Download ZIP

If you do not want to use Git:

1. Open the GitHub repository page.
2. Click `Code`.
3. Click `Download ZIP`.
4. Unzip the file.
5. Open Terminal or Command Prompt inside the unzipped project folder.

### Start the local server

On macOS or Linux:

```bash
python3 -m http.server 5173
```

On Windows:

```bash
py -m http.server 5173
```

Then open this address in your browser:

```text
http://localhost:5173
```

If port `5173` is already busy, use another port:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Chrome or Edge is recommended because webcam and MediaPipe pose tracking support is strongest there. Camera access usually requires the page to be served from `localhost` or HTTPS. Opening `index.html` directly may block webcam features in some browsers.

## How to play

1. Click `Camera` and step into frame.
2. Enter your player name.
3. Choose a song, then wait for `Audio map 100%`.
4. Press `Start`.
5. Dance after the countdown.

The song starts after the countdown, so the round begins cleanly with the music.

## Scoring

Each beat can score as:

- `Perfect`
- `Great`
- `Good`
- `Miss`

Timing matters, but movement matters too. A hit needs fresh movement near the beat. Standing still, walking out of frame, or being too close for the tracker to see a playable body view should score as a miss.

The game uses pose tracking when available and falls back to motion tracking if the pose model cannot load. Pose scoring looks for real movement relative to your body, so simple camera drift or slow swaying is filtered more aggressively. Head movement can still score when your full/playable body is visible.

## Game Systems

- Automatic uploaded-song beat and downbeat mapping
- Webcam countdown before music and scoring begin
- Mirrored camera stage with skeleton/body tracking overlay
- Beat lane that shows upcoming beats
- Difficulty slider for movement required
- Timing Forgiveness slider for hit-window size
- Camera Timing Assist slider and calibration mode
- Combo multiplier that grows with longer combos
- Comeback boost after misses, cashed in on the next Good, Great, or Perfect
- Flow Mode after a long Perfect streak
- Accuracy, combo, multiplier, best score, and time tracking
- Results screen at the end of each round

## Leaderboards

High scores are saved locally in the browser per song and player name.

Leaderboard controls:

- `Export` saves scores as a CSV file.
- `Import` merges a CSV leaderboard back in.
- `Share` uses native sharing when available, or copies leaderboard text.
- `Clear` removes local scores.

## Audio Analysis

Uploaded songs are analyzed locally in the browser. The game estimates tempo, beat positions, downbeats, and song difficulty automatically. If analysis fails, it falls back to a regular beat grid based on the best available BPM estimate.

## Body Tracking

The game uses MediaPipe pose-landmark tracking from a browser CDN when available. It requires a playable body view before pose scoring is active. A face-only closeup should not count as a valid body-tracking state.

If MediaPipe cannot load, the game can still use motion-based camera tracking as a fallback.

## Current Notes

This is an active prototype. The current focus is making scoring feel fair and fun:

- Reward intentional dance movement.
- Prevent easy scoring from standing still, drifting, or face-only framing.
- Keep the full game playable in one desktop viewport without page scrolling.
