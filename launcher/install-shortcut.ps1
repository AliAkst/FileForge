# Creates (or refreshes) the FileForge desktop shortcut.
# Run: powershell -ExecutionPolicy Bypass -File launcher\install-shortcut.ps1

$ErrorActionPreference = 'Stop'

$launcherDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $launcherDir
$vbs = Join-Path $launcherDir 'FileForge.vbs'
$icon = Join-Path $launcherDir 'fileforge.ico'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'FileForge.lnk'

if (-not (Test-Path $vbs)) {
  throw "Launcher not found: $vbs"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
$shortcut.Arguments = '"' + $vbs + '"'
$shortcut.WorkingDirectory = $rootDir
$shortcut.IconLocation = $icon + ',0'
$shortcut.Description = 'FileForge - yerel dosya donusturucu'
$shortcut.Save()

Write-Output "Shortcut created: $shortcutPath"
