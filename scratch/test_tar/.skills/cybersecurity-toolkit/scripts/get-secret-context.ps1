param(
    [string]$file,
    [int]$line
)
$start = [math]::Max(1, $line - 5)
$end = $line + 5
$content = Get-Content $file | Select-Object -Skip ($start - 1) -First ($end - $start + 1)
$context = $content -join "`n"
$output = @{
    file = $file
    target_line = $line
    context = $context
}
$output | ConvertTo-Json -Compress
