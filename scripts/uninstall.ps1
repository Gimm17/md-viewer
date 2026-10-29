# uninstall.ps1 — Remove MD Viewer and its .md file association (HKCU only).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1
#   npm run uninstall:app

$ErrorActionPreference = "SilentlyContinue"

$AppName    = "MD Viewer"
$ProgId     = "MDViewer.md"
$Extensions = @(".md", ".markdown", ".mdown", ".mkd")
$classesKey = "HKCU:\Software\Classes"

# Stop a running instance.
Get-Process -Name "md-viewer" -ErrorAction SilentlyContinue | Stop-Process -Force

# 1) Remove ProgID.
Remove-Item -Path (Join-Path $classesKey $ProgId) -Recurse -Force

# 2) Remove Application entry.
Remove-Item -Path (Join-Path $classesKey "Applications\md-viewer.exe") -Recurse -Force

# 3) Remove the ProgID from each extension's OpenWithProgids & default.
foreach ($ext in $Extensions) {
    $extKey = Join-Path $classesKey $ext
    if (Test-Path $extKey) {
        $curDef = (Get-ItemProperty -Path $extKey -Name "(Default)" -ErrorAction SilentlyContinue)."(Default)"
        if ($curDef -eq $ProgId) {
            Remove-ItemProperty -Path $extKey -Name "(Default)" -Force
        }
    }
    $owpKey = Join-Path $classesKey "$ext\OpenWithProgids"
    if (Test-Path $owpKey) {
        Remove-ItemProperty -Path $owpKey -Name $ProgId -Force
    }
    # Clear UserChoice if it pointed to MDViewer
    $userChoice = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$ext"
    if (Test-Path $userChoice) {
        Remove-Item -Path $userChoice -Recurse -Force
    }
    Write-Host "Unregistered '$ext'"
}

# 4) Remove Start Menu shortcut
$startMenuShortcut = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\$AppName.lnk"
if (Test-Path $startMenuShortcut) {
    Remove-Item -Path $startMenuShortcut -Force
    Write-Host "Removed Start Menu shortcut"
}

# 5) Remove installed files.
$installDir = Join-Path $env:LOCALAPPDATA $AppName
if (Test-Path $installDir) {
    Remove-Item -Path $installDir -Recurse -Force
    Write-Host "Removed $installDir"
}

# Notify the shell.
Add-Type -Namespace Win32 -Name Shell -MemberDefinition @"
[System.Runtime.InteropServices.DllImport("shell32.dll")]
public static extern void SHChangeNotify(int eventId, int flags, System.IntPtr item1, System.IntPtr item2);
"@
[Win32.Shell]::SHChangeNotify(0x08000000, 0x0000, [System.IntPtr]::Zero, [System.IntPtr]::Zero)

Write-Host ""
Write-Host "MD Viewer uninstalled successfully." -ForegroundColor Green
