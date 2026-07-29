param (
    [Parameter(Mandatory=$true)]
    [string]$SkillName
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$tempScript = [System.IO.Path]::GetTempFileName() + ".js"

$jsContent = @"
const { execSync } = require('child_process');

try {
    const label = `"$SkillName`";
    const words = label.trim().split(/\s+/);
    let allLines = [];

    for (const word of words) {
        let output = execSync('npx -y figlet-cli -f `"ANSI Shadow`" `"' + word + '`"').toString();
        let lines = output.split('\n');
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        // Pure untouched native indents for all letters (A, C, G, O, Q, T)
        allLines.push(...lines);
    }
    
    const maxLen = Math.max(...allLines.map(l => l.length));
    const formatted = allLines.map(line => '  ' + line.padEnd(maxLen, ' ') + '  ');
    
    console.log(JSON.stringify(formatted, null, 2));
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
"@

Set-Content -Path $tempScript -Value $jsContent

try {
    $result = node $tempScript
    Write-Output $result
} finally {
    Remove-Item -Path $tempScript -ErrorAction SilentlyContinue
}
