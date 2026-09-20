Output demo.gif
Output demo.png
Require path/to/your-binary.exe

Set FontSize 15
Set Width 1200
Set Height 800
Set Padding 20
Set Framerate 60

Hide
Type "your launch command"
Enter
Show

# Wait for the splash screen, then capture it
Sleep 4s
Screenshot demo_splash.png

# Advance to the main UI and capture it
Enter
Sleep 2s
Screenshot demo_main.png
Sleep 2s

# Show interaction here (Down, Space, Tab, Type, Enter with Sleep between steps)

# Capture the final state
Screenshot demo_final.png
