# Cadence Algorithmic Audio

**Version:** 2

**Target:** `.skills/cadence`

**Category:** Audio & Creative Media

**Keywords:** `cadence`, `live-coding`, `algorithmic-music`, `pattern-synthesis`, `mini-notation`, `web-audio-api`, `euclidean-rhythms`, `tracker-arranger`, `stage-cueing`, `trance-gate`, `orbit-soloing`

## Description
Cadence Algorithmic Audio is a browser-native live coding music studio, pattern compiler, and performance suite designed for artists, audio engineers, and creative coders. It compiles expressive pattern mini-notation into real-time Web Audio soundscapes, multi-layer poly-rhythmic drum grooves, tracker-style timeline arrangements, and evolving harmonic structures.

## Capabilities & Use Cases
* **Mini-Notation Pattern Grammar**: Concise expressive micro-syntax supporting space-delimited sequences, bracketed subdivisions, multiplication repetitions, division stretches, silence rests, and alternating cycle structures.
* **Tracker-Style Multi-Track Arranger**: Timeline-based matrix sequencing (`track` and `ar`) for orchestrating multi-stem instrument layers over long-form song structures using step masks and dynamic modifiers.
* **Dynamic Stage Cueing System**: Global scene tagging (`.cue`, `.oncue`, and `setCue`) allowing performers to trigger seamless transitions between Intro, Verse, Drop, and Breakdown sections during live sets.
* **Live Orbit Muting and Soloing**: Independent channel routing (`.o`, `solo`, and `mute`) providing immediate stem isolation and breakdown tension on the fly.
* **Acid Filter and Velocity Accent Modeling**: Dedicated 303-style resonant envelope shapers (`acidenv`, `accent`, and `rlpf`) delivering expressive synthesizer sweeps.
* **Algorithmic Trance Gating**: Rhythmic chopping and staccato gating (`tgate` and `trancegate`) combined with gap-filling (`.fill`) for progressive trance and synthwave pads.
* **Harmonic Scale Quantization**: Pitch quantizer (`.grab`) mapping arbitrary melodic lines to target scales and chord intervals.
* **Multi-Voice Web Audio Synthesis**: Zero-latency browser-native sound generation featuring subtractive lead oscillators, 808-style drum synthesizers, resonant basslines, and frequency modulation textures.
* **Audio-Reactive Visual Telemetry**: Integrated oscilloscope waveforms, frequency spectrum analysis, and 16-step animated rhythm visualizers locked to tempo clock pulses.

## Usage
Activate Cadence when authoring algorithmic music, building generative web audio experiences, or performing live algorithmic sets.

```javascript
// Example: Acid 303 Sequence with Stage Cueing and Accents
s("bd*4", "[~ cp]*2", "hh(7,16)")
  .cue("1", "2")
  .room(0.2)

note("c2 c2 eb2 f2 g2 bb2 c3 bb2")
  .s("sawtooth")
  .acidenv("<0.3 0.6 0.9 0.4>")
  .accent("<0 0 1 0 0 1 0 2>")
  .cue("2")
```

## Changelog
* **v2** : Integrated performance macro toolkit including tracker style multi track arrangement, dynamic stage cueing protocols, live orbit soloing and muting, TB 303 acid filter envelope models, algorithmic trance gating, and pitch scale quantizers.
* **v1** : Initial release of Cadence Algorithmic Audio live coding studio, Web Audio synthesis engine, pattern mini-notation compiler, and interactive performance sandbox.
