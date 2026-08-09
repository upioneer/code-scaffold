import time
import math
import sys
sys.stdout.reconfigure(encoding='utf-8')

# A simple Braille spinner
frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

# A braille sine wave animation across a 2x4 matrix per char
# We will just do a simple scrolling wave for the demo.
def render_wave(offset, width=40):
    output = ""
    for x in range(width):
        y = math.sin((x + offset) * 0.3)
        # map y from [-1, 1] to [0, 3] for the 4 vertical dots in braille
        dot_y = int((y + 1) * 1.5) 
        
        # Braille base is 0x2800. 
        # Column 1 dots: 0x1, 0x2, 0x4, 0x40
        # Column 2 dots: 0x8, 0x10, 0x20, 0x80
        # We will just light up a single dot in column 1 for simplicity
        dots = [0x1, 0x2, 0x4, 0x40]
        char_code = 0x2800 + dots[dot_y]
        output += chr(char_code)
    return output

print("Preview of High-Density Braille Animations\n")
print("1. Traditional Braille Spinner:")
for f in frames:
    sys.stdout.write(f"\r{f} Loading components...")
    sys.stdout.flush()
    time.sleep(0.1)

print("\n\n2. High-Density Braille Sine Wave (Fluid Motion):")
for i in range(20):
    wave = render_wave(i)
    sys.stdout.write(f"\r{wave}")
    sys.stdout.flush()
    time.sleep(0.1)

print("\n\nPreview complete.")
