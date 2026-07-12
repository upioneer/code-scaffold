Output demo.gif
Output demo.png
Require scaffold-tui/target/debug/code-scaffold.exe

Set FontSize 15
Set Width 1200
Set Height 800
Set Padding 20
Set Theme "Default"
Set Framerate 60

# Run the command
Type "scaffold-tui/target/debug/code-scaffold.exe"
Enter
Sleep 1s

# Wait for the welcome splash screen
Sleep 4s

# Capture the splash screen
Screenshot demo_splash.png

# Press Enter to go to the main UI
Enter
Sleep 2s

# Capture the main UI
Screenshot demo_main.png
Sleep 2s

# Show some interaction
Down 2
Sleep 1s
Space
Sleep 1s
Tab
Sleep 1s
Down
Sleep 1s
Space
Sleep 2s

# Capture final state
Screenshot demo_final.png
