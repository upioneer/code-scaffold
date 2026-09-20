param (
    [Parameter(Mandatory=$true)]
    [string]$SkillName
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$tempScript = [System.IO.Path]::GetTempFileName() + ".js"

$jsContent = @'
const { execSync } = require('child_process');

try {
    const brand = process.argv[2] ? process.argv[2].trim() : '';
    if (!brand) {
        throw new Error("Brand name cannot be empty");
    }

    const output = execSync('npx -y figlet-cli -f "ANSI Shadow" "' + brand + '"').toString();
    let lines = output.split('\n');
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    if (lines.length !== 6) {
        throw new Error(`ANSI Shadow font must produce exactly 6 lines. Received: ${lines.length}`);
    }

    const maxLen = Math.max(...lines.map(l => l.length));
    const formatted = lines.map(line => '  ' + line.padEnd(maxLen, ' ') + '  ');

    const widths = formatted.map(l => l.length);
    if (Math.max(...widths) !== Math.min(...widths)) {
        throw new Error("Logo lines have non-uniform widths after padding.");
    }
    if (Math.max(...widths) > 88) {
        throw new Error(`Logo width ${Math.max(...widths)} exceeds the 88-column SkillForge invariant. Use a shorter brand slug (reference renderer: classic FIGlet ANSI Shadow as bundled with pyfiglet).`);
    }

    console.log(JSON.stringify(formatted, null, 2));
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
'@

Set-Content -Path $tempScript -Value $jsContent

try {
    $result = node $tempScript "$SkillName"
    Write-Output $result
} finally {
    Remove-Item -Path $tempScript -ErrorAction SilentlyContinue
}
