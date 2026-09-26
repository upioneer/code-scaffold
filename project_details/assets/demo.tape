Output demo.gif
Output demo.png
Require "/mnt/c/Users/hgran/OneDrive/Documents/code/Projects/Code-Scaffold/scaffold-tui/target/debug/code-scaffold.exe"

Set FontSize 15
Set Width 1200
Set Height 800
Set Padding 20
Set Framerate 30

Hide
Type "mkdir -p /tmp/vhs-demo && cd /tmp/vhs-demo && clear"
Enter
Show
Type "/mnt/c/Users/hgran/OneDrive/Documents/code/Projects/Code-Scaffold/scaffold-tui/target/debug/code-scaffold.exe"
Enter

# Wait for the welcome splash screen
Sleep 4s

# Capture the splash screen
Screenshot demo_splash.png

# Walk the wizard to Deploy with default selections (ENTER advances each step)
Enter
Sleep 2s
Enter
Sleep 2s
Enter
Sleep 2s
Enter
Sleep 2s
Enter
Sleep 2s
Enter
Sleep 2s
Enter
Sleep 2s
Screenshot demo_deploy.png

# Execute the deployment, then capture the typed out report card
Enter
Sleep 45s
Screenshot demo_report.png
Sleep 10s
Screenshot demo_report_full.png
Sleep 3s
