# Version 4.6.1

## Bug Fixes & Optimizations
* **UI Theme Cycle Desync**: Fixed a state initialization bug where the starting theme index (`0`) did not match the default theme's loaded layout index (`1`). This off-by-one misalignment required users to press the `T` key twice during initial startup in order to successfully cycle the UI to the next theme. Initializing the index properly at `1` fixes this behavior.
