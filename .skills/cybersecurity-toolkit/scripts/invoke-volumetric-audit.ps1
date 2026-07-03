param(
    [string]$url,
    [string]$method = "GET",
    [string]$payload = "",
    [int]$requests = 10
)
if ($requests -gt 10) { $requests = 10 }
$statusCodes = @{}
$rateLimited = $false
for ($i=0; $i -lt $requests; $i++) {
    try {
        if ($method -eq "POST" -and $payload) {
            $res = Invoke-WebRequest -Uri $url -Method POST -Body $payload -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
            $code = $res.StatusCode
        } else {
            $res = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -ErrorAction Stop
            $code = $res.StatusCode
        }
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        } else {
            $code = 500
        }
    }
    $key = $code.ToString()
    if (-not $statusCodes.ContainsKey($key)) { $statusCodes[$key] = 0 }
    $statusCodes[$key]++
    if ($code -eq 429) { $rateLimited = $true }
}
$output = @{
    target = $url
    total_requests = $requests
    status_codes = $statusCodes
    rate_limit_triggered = $rateLimited
}
$output | ConvertTo-Json -Depth 3 -Compress
