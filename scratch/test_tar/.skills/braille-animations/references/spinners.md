# Braille Spinners Reference

The `unicode-animations` library provides 18 pre-defined spinners. Each spinner consists of an array of frames (unicode braille characters) and a recommended interval.

## Available Spinners

| Name | Description |
| :--- | :--- |
| `braille` | Standard braille spinner (8 dots rotating) |
| `helix` | Helix-like rotation |
| `dots` | Individual dots moving |
| `wave` | Wavy dot pattern |
| `pulse` | Pulsing dot pattern |
| `circle` | Circular rotation |
| `quad` | Four-quadrant animation |
| `line` | Moving horizontal/vertical lines |
| ... and more. | |

## Frame Examples

### `braille`
Frames: `["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]`
Interval: 80ms

### `helix`
Frames: `["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏", "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]` (Extended helix pattern)
Interval: 100ms

## Custom Grid to Braille

A braille character represents a 2x4 grid:
```
(0,0) (1,0)  -> Dot 1, Dot 4
(0,1) (1,1)  -> Dot 2, Dot 5
(0,2) (1,2)  -> Dot 3, Dot 6
(0,3) (1,3)  -> Dot 7, Dot 8
```

Bit mapping (0x2800 + sum of bits):
- Dot 1: 0x01
- Dot 2: 0x02
- Dot 3: 0x04
- Dot 4: 0x08
- Dot 5: 0x10
- Dot 6: 0x20
- Dot 7: 0x40
- Dot 8: 0x80
