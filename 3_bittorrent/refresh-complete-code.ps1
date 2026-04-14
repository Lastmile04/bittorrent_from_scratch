$root = $PSScriptRoot
$out  = Join-Path $root "completeCode.md"

Set-Content $out "# Complete code dump`n"

Get-ChildItem $root -Recurse -File -Filter *.js |
Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\.git\\' -and
    $_.FullName -notmatch '\\dist\\' -and
    $_.FullName -notmatch '\\build\\'
} |
Sort-Object FullName |
ForEach-Object {
    $relative = Resolve-Path -Relative $_.FullName
    Add-Content $out "`n`n## $relative`n"
    Add-Content $out '```js'
    Get-Content $_.FullName | Add-Content $out
    Add-Content $out '```'
}

Write-Host "Updated $out"
