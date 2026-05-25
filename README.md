# BeatCam Dance by Niko

A browser-based dance game prototype that scores webcam motion against a song's beat.

## Run it

Start a local server from this folder:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

The app works with the built-in demo beat or an uploaded audio file. Uploaded songs are mapped automatically; the BPM, tap, and offset controls are there for correction when a song needs a human nudge.

Uploaded songs are analyzed locally in the browser. The skeleton tracker uses MediaPipe's browser model from a CDN; if it cannot load, the game keeps working with motion-based tracking.

## Current prototype

- Webcam motion tracking with a mirrored camera stage
- MediaPipe pose-landmark tracking when the model can load, with motion fallback
- Skeleton/body-box overlay that pulses on beat hits
- Webcam countdown before every round so music and scoring start together
- Richer uploaded-song beat and downbeat mapping from in-browser audio analysis
- Audio map status that shows analysis progress and a ready state
- Beat lane driven by the generated beat map, BPM, and beat offset
- Difficulty slider capped to a playable movement range
- Built-in synth demo beat
- Uploaded local audio files
- Perfect, Great, Good, and Miss scoring
- Early/late hit diagnostics with movement strength
- Camera timing assist for scoring webcam movement against the beat
- Combo multiplier scoring with reset-on-miss behavior
- Comeback boost after missed beats, scaled by Good, Great, or Perfect timing
- Combo, multiplier, accuracy, and best-score tracking
- Local high scores saved per song
- Export, import, and share controls for the local leaderboard
- First-run intro and guided tutorial bubbles

## Next upgrades

- Add named dance moves and choreography prompts
- Support multiple local players per song
