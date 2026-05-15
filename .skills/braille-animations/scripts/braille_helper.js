/**
 * Braille Helper Utility
 * Provides grid-to-braille conversion and spinner preview.
 */

const DOTS = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80]
];

/**
 * Converts a 2x4 boolean grid to a braille character.
 * @param {boolean[][]} grid - 4 rows, 2 columns
 * @returns {string}
 */
function gridToBraille(grid) {
    let code = 0;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
            if (grid[r] && grid[r][c]) {
                code |= DOTS[r][c];
            }
        }
    }
    return String.fromCharCode(0x2800 + code);
}

/**
 * Creates a blank 4x2 grid.
 */
function makeGrid() {
    return Array.from({ length: 4 }, () => [false, false]);
}

// CLI usage
const args = process.argv.slice(2);
if (args[0] === 'demo') {
    const grid = makeGrid();
    grid[0][0] = true;
    grid[1][1] = true;
    grid[2][0] = true;
    grid[3][1] = true;
    console.log('Sample Braille:', gridToBraille(grid));
}

export { gridToBraille, makeGrid };
