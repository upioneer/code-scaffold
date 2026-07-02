$runs = Invoke-RestMethod "https://api.github.com/repos/upioneer/code-scaffold/actions/runs?per_page=2"
foreach ($run in $runs.workflow_runs) {
    Write-Host "Run: $($run.head_branch) - $($run.status) - $($run.conclusion)"
    $jobs = Invoke-RestMethod $run.jobs_url
    foreach ($job in $jobs.jobs) {
        $check_url = "https://api.github.com/repos/upioneer/code-scaffold/check-runs/$($job.id)/annotations"
        $annotations = Invoke-RestMethod $check_url
        foreach ($ann in $annotations) {
            Write-Host "Annotation [$($ann.annotation_level)] in $($job.name): $($ann.message)"
        }
    }
}
