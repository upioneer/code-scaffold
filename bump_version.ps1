param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$NewVersion
)

& "$PSScriptRoot\project_details\playbooks\bump_version.ps1" $NewVersion
