import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

# A static "CS" (Code Scaffold) rendered in high-res braille dots
# This is a 2D array of braille characters
logo_frames = [
    # Frame 1: Faint / assembling
    [
        "⠠⠤⠤⠤⠤⠤⠤⠄  ⠠⠤⠤⠤⠤⠤⠤⠄",
        "⠰⠁      ⠄  ⠰⠁      ⠄",
        "⠰⠁         ⠰⠤⠤⠤⠤⠤⠤⠄",
        "⠰⠁      ⠄        ⠰⠁",
        "⠠⠤⠤⠤⠤⠤⠤⠄  ⠠⠤⠤⠤⠤⠤⠤⠄"
    ],
    # Frame 2: Solidifying
    [
        "⠶⠒⠒⠒⠒⠒⠒⠲  ⠶⠒⠒⠒⠒⠒⠒⠲",
        "⠸⠃      ⠘  ⠸⠃      ⠘",
        "⠸⠃         ⠶⠒⠒⠒⠒⠒⠒⠲",
        "⠸⠃      ⠘        ⠸⠃",
        "⠶⠒⠒⠒⠒⠒⠒⠲  ⠶⠒⠒⠒⠒⠒⠒⠲"
    ],
    # Frame 3: Fully rendered / bold
    [
        "⣿⠉⠉⠉⠉⠉⠉⠉⡇  ⣿⠉⠉⠉⠉⠉⠉⠉⡇",
        "⣿⡇      ⢸  ⣿⡇      ⢸",
        "⣿⡇         ⣿⠉⠉⠉⠉⠉⠉⠉⡇",
        "⣿⡇      ⢸        ⣿⡇",
        "⣿⣀⣀⣀⣀⣀⣀⣀⡇  ⣿⣀⣀⣀⣀⣀⣀⣀⡇"
    ]
]

print("Preview: Animating a large logo using Braille Grids\n")

# Loop the animation a few times to show the shimmering/assembling effect
for _ in range(3):
    for frame in logo_frames:
        # Move cursor up 5 lines (the height of the logo) to overwrite it in place
        # The first time we don't move up, so we handle that by printing newlines first
        sys.stdout.write("\033[5A")
        
        for line in frame:
            # Clear line and print the new frame line
            sys.stdout.write(f"\033[2K{line}\n")
            
        sys.stdout.flush()
        time.sleep(0.3)
        
print("\nImagine this, but spanning the full width of your terminal spelling out 'CODE SCAFFOLD'!")
