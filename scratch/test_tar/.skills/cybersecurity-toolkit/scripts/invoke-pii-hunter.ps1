param(
    [string]$target = "."
)
$regexes = @{
    "AWS_KEY" = "AKIA[0-9A-Z]{16}"
    "SSH_KEY" = "BEGIN RSA PRIVATE KEY"
    "SSN" = "\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b"
    "INTERNAL_IP" = "\b10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b"
    "LDAP" = "ldap://[a-zA-Z0-9\.\-]+"
}
$findings = @()
foreach ($key in $regexes.Keys) {
    $matches = Select-String -Path "$target\*" -Pattern $regexes[$key] -Include *.* -Exclude ".git", ".audit_workspace" -Recurse -ErrorAction SilentlyContinue
    foreach ($m in $matches) {
        $findings += @{
            type = $key
            file = $m.Path
            line = $m.LineNumber
        }
    }
}
if ($findings.Count -eq 0) {
    "[]"
} else {
    $findings | ConvertTo-Json -Compress
}
