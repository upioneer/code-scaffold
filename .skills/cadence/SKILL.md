---
​‌‍name: cadence
description: Trigger when the user requests live coding music, algorithmic audio composition, tracker-style arrangement, pattern generation, mini-notation soundscapes, Web Audio synthesis, generative beat making, or performance audio engineering.
keywords:
  - cadence
  - live-coding
  - algorithmic-music
  - music-composition
  - pattern-synthesis
  - mini-notation
  - web-audio-api
  - euclidean-rhythms
  - polymeter
  - breakbeat
  - synthwave
  - techno-synthesis
  - audio-dsp
  - sound-design
  - creative-coding
  - generative-music
  - beat-making
  - acid-bassline
  - frequency-modulation
  - audio-visualizer
  - oscilloscope
  - live-performance
  - step-sequencer
  - chords-scales
  - midi-clock
  - tracker-arranger
  - stage-cueing
  - trance-gate
  - acid-envelope
  - scale-quantizer
---

# Cadence Algorithmic Audio Architecture & Pattern Engine

Cadence is a browser-native live coding music studio, pattern compiler, and algorithmic sound design framework. It transforms concise pattern mini-notation into real-time Web Audio synthesis, multi-track drum arrangements, tracker-style macro timelines, and generative harmonic progressions.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.

---

## 1. Core Pattern Mini-Notation Grammar

Cadence patterns operate over continuous rhythmic cycles. Within each cycle, string expressions define when events trigger, how time subdivides, and which layers run in parallel.

### 1.1 Fundamental Syntax Tokens

* **Space (Sequential Steps)**: Elements separated by spaces divide the cycle into equal durations.
  ```javascript
  s("bd sd hh cp") // Four quarter-cycle events: kick, snare, hat, clap
  ```
* **Brackets `[...]` (Subdivisions)**: Groups events into a single step, subdividing that step's time.
  ```javascript
  s("bd [sd hh] bd [sd cp]") // Steps 2 and 4 are subdivided in half
  s("bd [sd [hh hh]]") // Nested subdivisions create rapid rolls
  ```
* **Commas `,` (Polyphonic Layers)**: Plays independent parallel sequences simultaneously.
  ```javascript
  s("bd*4", "hh*8", "[~ sd]*2") // Kick on quarter notes, hi-hat on eighths, snare on backbeats
  ```
* **Asterisk `*N` (Repetition)**: Multiplies event frequency within its allotted slice of time.
  ```javascript
  s("bd*4") // Plays 4 kicks evenly spaced across the cycle
  s("hh*16") // Rapid 16th-note hi-hat sequence
  ```
* **Slash `/N` (Elongation & Slowing)**: Spans an event or group across multiple cycles.
  ```javascript
  s("cp/2") // Plays one clap every two cycles
  s("[bd sd]/4") // Stretches kick and snare across four full cycles
  ```
* **Tilde `~` (Silence & Rests)**: Holds a musical rest for that duration slot.
  ```javascript
  s("bd ~ sd ~") // Traditional kick and snare on steps 1 and 3
  s("[~ hh]*4") // Offbeat syncopated hi-hat groove
  ```
* **Angle Brackets `<...>` (Cycle Alternation)**: Steps to the next item on each subsequent cycle.
  ```javascript
  s("<bd hh> sd") // Plays 'bd sd' in cycle 1, then 'hh sd' in cycle 2
  s("bd <sd [sd cp]>") // Alternates simple snare with layered clap
  ```
* **Parentheses `(k, n)` (Euclidean Rhythm)**: Computes the Bjorklund Euclidean distribution of `k` active pulses across `n` steps.
  ```javascript
  s("bd(3,8)") // Cuban tresillo rhythm (3 pulses over 8 steps)
  s("hh(5,8)") // Cinquillo rhythm (5 pulses over 8 steps)
  s("cp(7,16)") // Dense syncopated poly-metric groove
  ```

---

## 2. Harmonic Engine, Note Sequences & Scales

Cadence provides first-class melodic sequencing through note patterns, scale quantizers, and chord voicing expansions.

### 2.1 Note Expressions
```javascript
// Pitch sequencing by scientific pitch notation
note("c2 [e2 g2] [b2 d3] c2")
  .s("sawtooth")
  .lpf(1200)

// Relative scale degree indexing with scale mapping
note("0 2 4 6 7 4 2 0")
  .scale("minor")
  .s("square")
  .decay(0.3)
```

### 2.2 Chord Voicing Expansion
```javascript
// Chord symbol expansion directly inside note patterns
note("c'min7 f'7 bb'maj7 eb'maj7")
  .s("triangle")
  .room(0.6)
  .decay(1.5)
```

Supported scale modes: `major`, `minor`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`, `pentatonic`, `blues`, `chromatic`.

---

## 3. Signal Flow & Web Audio DSP Architecture

Every Cadence channel feeds into a flexible signal processing chain comprising oscillators, amplitude envelopes, resonant filters, spatial pans, and time-based delay/reverb networks.

```
[Pattern Clock] -> [Trigger Dispatcher]
                         |
                         v
     [Audio Source (Oscillator / Noise / Sampler)]
                         |
                         v
               [ADSR Amplitude Envelope]
                         |
                         v
           [Resonant Biquad Filter (LPF/HPF)]
                         |
                         v
               [Stereo Panner Node]
                    /          \
                   /            \
          [Dry Path]     [Send FX: Delay + Reverb]
                   \            /
                    \          /
                 [Master Gain & Limiter]
                         |
                         v
                [Audio Destination]
```

### 3.1 Primary DSP Modifiers

* `.s("voice")`: Selects sound generator: `sine`, `triangle`, `sawtooth`, `square`, `noise`, `bd`, `sd`, `hh`, `cp`, `rim`, `tom`, `bass`, `lead`.
* `.lpf(cutoff)`: Low-pass filter cutoff frequency in Hertz (20 Hz to 20000 Hz).
* `.hpf(cutoff)`: High-pass filter cutoff frequency in Hertz.
* `.resonance(q)`: Filter resonance Q-factor (0.1 to 30.0) for sharp acid squelch.
* `.attack(seconds)`: Amplitude envelope attack time.
* `.decay(seconds)`: Amplitude envelope decay duration.
* `.sustain(gain)`: Sustain level from 0.0 to 1.0.
* `.release(seconds)`: Envelope release time after note end.
* `.pan(pos)`: Stereo positioning (-1.0 full left to +1.0 full right).
* `.gain(vol)`: Channel volume scaling factor (0.0 to 2.0).
* `.delay(time)`: Echo time in fractions of a cycle or seconds.
* `.delayfeedback(amount)`: Delay feedback repeats (0.0 to 0.95).
* `.room(amount)`: Algorithmic reverb wetness (0.0 dry to 1.0 cathedral).

---

## 4. Advanced Performance Macros & Arrangement Engine

Cadence includes high-level performance macros and tracker arrangement functions designed for live stage navigation and complex multi-part compositions.

### 4.1 Tracker-Style Multi-Track Arranger (`track`)
The `track` macro orchestrates multiple instrument stems over cycle blocks using timeline string masks:

```javascript
// Arrange 5 instrument stems over progressive 8-cycle sections
track(
  [bd, sd, hat, clap, bass],
  2, "--------0------1-------1--------0", // Intro: hat + clap only
  2, "1-------0------1-------D--------0", // Verse: kick + delay modifier
  4, "1-------1------1-------1--------1", // Drop: full arrangement
  [['D', (pat) => pat.delay(0.5)]]        // Step modifier dictionary
)
```

### 4.2 Quick Multi-Cycle Sequencing (`ar`)
Sequences multiple patterns across consecutive cycle durations without manual clock math:

```javascript
// 4 cycles of bassline A, followed by 2 cycles of turnaround B
ar(
  4, "<c2 eb2 f2 g2>(3,8)",
  2, "<bb2 c3>(5,8)"
).s("sawtooth").lpf(900)
```

### 4.3 Dynamic Stage Cueing Protocol (`.cue`, `.oncue`, `setCue`)
Enables live performers to tag stems with scene cues (Intro "0", Verse "1", Drop "2", Outro "3") and trigger transitions globally:

```javascript
// Tag layers with cues
s("bd*4").cue("1", "2") // Plays during verse and drop
s("hh*16").cue("2")     // Activates exclusively on the drop
note("c2 eb2 g2").cue("0", (p) => p.room(0.8)) // Lush ambient intro modifier

// Live performer switches scene globally
setCue("2") // Instantly engages Drop scene across all cue-bound channels
```

### 4.4 Live Orbit Muting & Soloing (`.o`, `solo`, `mute`)
Isolates or silences instrument channels live on stage by assigning orbit identifiers:

```javascript
s("bd*4").o(1)
s("hh*8").o(2)
note("c2 [eb2 g2]").o(3)

// Live command line controls
solo(1, 3) // Solos kick and bassline, silencing hi-hats
mute(1)    // Mutes kick drum for breakdown tension
solo()     // Clears solo state, restoring all tracks
```

### 4.5 Acid Filter & Velocity Accent Modeling (`acidenv`, `accent`, `rlpf`)
Specialized resonant models designed for expressive 303-style basslines:

* `pat.acidenv(amount)`: Maps normalized 0 to 1 value to sweet-spot resonant filter envelope decays and depths.
* `pat.accent(amount)`: Automatically couples velocity increase with snappy filter envelope decay (`lpenv`).
* `pat.rlpf(x)` / `pat.rhpf(x)`: Logarithmic normalized filter sweeps from 0.0 to 1.0.

### 4.6 Algorithmic Trance Gating (`tgate`, `trancegate`, `.fill`)
* `pat.tgate(amount, cycle, length)`: Rhythmic staccato gating across sustained pads and leads with pseudo-random seed tables.
* `pat.fill()`: Extends event durations to fill silent gaps between notes, transforming staccato points into continuous legato lines.

### 4.7 Scale Quantization & Note Snapping (`.grab`)
Snaps arbitrary or randomized pitch values to specific musical scales or chord intervals:

```javascript
// Constrains random pitch jumps to Dorian root triad
note("c2 [rand*4] g2 [rand*2]")
  .grab("c:eb:g:bb")
  .s("sawtooth")
```

---

## 5. Curated Genre Blueprints

### 5.1 Cyberpunk Breakbeat
```javascript
// Heavy syncopated break with distorted bassline
s("bd [~ bd] [~ sd] [bd bd]", "[~ hh]*4, [hh*8]/2")
  .gain(0.9)
  .room(0.2)

note("c1 [~ c1] [eb1 f1] [g1 ~]")
  .s("sawtooth")
  .lpf(800)
  .resonance(12)
  .decay(0.4)
```

### 5.2 Acid Techno 303 with Live Cueing
```javascript
// 303 acid sequence with dynamic stage cues and accent modeling
s("bd*4", "[~ cp]*2", "hh(7,16)")
  .cue("1", "2")
  .room(0.15)

note("c2 c2 eb2 f2 g2 bb2 c3 bb2")
  .s("sawtooth")
  .acidenv("<0.3 0.6 0.9 0.4>")
  .accent("<0 0 1 0 0 1 0 2>")
  .cue("2")
```

### 5.3 Deep Ambient Drift
```javascript
// Evolving generative chords with expansive space
note("<c'min9 f'min9 g'min7 ab'maj7>")
  .s("sine")
  .attack(0.8)
  .decay(3.2)
  .room(0.85)
  .pan("<-0.4 0.4 0.2 -0.2>")
```

### 5.4 Euclidean Poly-Rhythm
```javascript
// Interlocking African-inspired metric cycles
s("bd(3,8)", "sd(5,16)", "hh(7,12)", "cp(2,5)")
  .gain(0.85)
  .room(0.3)
```

---

## 6. Live Performance Protocols & Stage Readiness

When performing live algorithmic sets with Cadence, adhere to these operational safety protocols:

1. **Quantized Code Evaluation**: Always evaluate code modifications on cycle boundaries to prevent phase cancellation or rhythm staggering.
2. **Emergency Hush Directive**: Maintain immediate access to `.hush()` or master gain mute (`gain(0)`) to instantly silence feedback loops or audio spikes.
3. **Headroom Management**: Summing 4 or more synth layers will clip 0 dBFS. Keep individual channel gains at `0.7` to `0.8` and engage soft-clipping master limiting.
4. **Stochastic Variation Techniques**:
   * Use `.sometimesBy(0.25, fn)` to introduce unexpected fills.
   * Use cycle alternations `<a b c>` for natural song structure progression.
   * Shift filter cutoff cyclically across 4-bar or 8-bar intervals.

---

## 7. AI Prompt-to-Pattern Translation Protocol

When translating human musical requests into Cadence code:

1. **Extract Rhythm & Tempo**: Determine genre BPM (e.g. Techno 130-135, House 124-128, Breakbeat 140-170, Ambient unquantized or 80-100).
2. **Draft Drum Foundation**: Combine kick (`bd`), snare/clap (`sd`/`cp`), and hi-hats (`hh`) with distinct syncopations or Euclidean structures.
3. **Establish Bass Anchor**: Provide a low-register (`c1` to `c2`) root progression supporting the rhythmic pulse.
4. **Overlay Harmonic & Lead Layers**: Add pads, arpeggios, or chord stabs in higher registers with spatial reverb and delay.
5. **Output Clean Executable Block**: Wrap the entire arrangement in cleanly formatted Cadence expressions that run immediately.
