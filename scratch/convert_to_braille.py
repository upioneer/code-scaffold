import sys
sys.stdout.reconfigure(encoding='utf-8')

raw_logo = """
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
███████╗ ██████╗ █████╗ ███████╗███████╗ ██████╗ ██╗     ██████╗
██╔════╝██╔════╝██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██╔══██╗
███████╗██║     ███████║█████╗  █████╗  ██║   ██║██║     ██║  ██║
╚════██║██║     ██╔══██║██╔══╝  ██╔══╝  ██║   ██║██║     ██║  ██║
███████║╚██████╗██║  ██║██║     ██║     ╚██████╔╝███████╗██████╔╝
╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝      ╚═════╝ ╚══════╝╚═════╝
""".strip("\n")

# We want to map this 12-line ascii block into a smaller braille block.
# Since braille is 4 dots high and 2 dots wide, we can map every 4x2 block of ascii characters into 1 braille character!
lines = raw_logo.split('\n')
max_len = max(len(l) for l in lines)
# pad lines
lines = [l.ljust(max_len) for l in lines]

braille_output = []
for r in range(0, len(lines), 4):
    row_str = ""
    for c in range(0, max_len, 2):
        dot_mask = 0
        for dy in range(4):
            for dx in range(2):
                if r + dy < len(lines) and c + dx < max_len:
                    char = lines[r + dy][c + dx]
                    if char != ' ':
                        # light up dot
                        bit = {
                            (0, 0): 0x1,
                            (0, 1): 0x2,
                            (0, 2): 0x4,
                            (0, 3): 0x40,
                            (1, 0): 0x8,
                            (1, 1): 0x10,
                            (1, 2): 0x20,
                            (1, 3): 0x80
                        }[(dx, dy)]
                        dot_mask |= bit
        if dot_mask == 0:
            row_str += ' '
        else:
            row_str += chr(0x2800 + dot_mask)
    braille_output.append(row_str)

print("\n".join(braille_output))
