# Run this AFTER creating the repo at https://github.com/new (name: streamgame, private).
# Usage: .\push-to-github.ps1
# Or:   .\push-to-github.ps1 -Username YourGitHubUsername

param([string]$Username)

if (-not $Username) {
    $Username = Read-Host "Enter your GitHub username (e.g. MordechaiusMaximus)"
}
if ([string]::IsNullOrWhiteSpace($Username)) {
    Write-Host "No username entered. Exiting."
    exit 1
}

$repoUrl = "https://github.com/$Username/streamgame.git"
Write-Host "Setting origin to: $repoUrl"
git remote set-url origin $repoUrl
git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDone! Repo URL: $repoUrl"
    Write-Host "It should appear in your Mordechaius Maximus app My Repos after refreshing (if GitHub is connected in Cursor)."
}
