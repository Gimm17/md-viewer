# install.ps1 — Install MD Viewer for the current user and register the .md
# file association (HKCU — no administrator rights required).
#
# What it does:
#   1. Copies the built EXE to %LOCALAPPDATA%\MD Viewer\md-viewer.exe
#      (a stable path, outside OneDrive, so associations don't break).
#   2. Copies appIcon.ico and registers it cleanly in the Registry without ",0"
#      so Windows Explorer immediately displays the MD Viewer logo on .md files.
#   3. Registers a ProgID + Application entry so MD Viewer appears in the
#      Windows "Open with" list and becomes default for .md / .markdown / .mdown / .mkd.
#   4. Creates a Start Menu shortcut for easy searching and launching.
#   5. Notifies the shell and refreshes Explorer icon cache.

param(
    [string]$ExePath
)

$ErrorActionPreference = "Stop"

$AppName    = "MD Viewer"
$ProgId     = "MDViewer.md"
$Extensions = @(".md", ".markdown", ".mdown", ".mkd")

# --- Resolve the source EXE ---
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

if (-not $ExePath -or -not (Test-Path $ExePath)) {
    $candidates = @(
        (Join-Path $scriptDir "md-viewer.exe"),
        (Join-Path $scriptDir "md-viewer-win_x64.exe"),
        (Join-Path $projectRoot "md-viewer.exe"),
        (Join-Path $projectRoot "md-viewer-win_x64.exe"),
        (Join-Path $projectRoot "dist\md-viewer\md-viewer-win_x64.exe"),
        (Join-Path (Get-Location) "md-viewer.exe")
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $ExePath = $cand
            break
        }
    }
}

if (-not $ExePath -or -not (Test-Path $ExePath)) {
    Write-Error "EXE not found. Run `npm run build` first, or provide -ExePath."
    exit 1
}
$ExePath = (Resolve-Path $ExePath).Path

# --- Copy EXE to a stable install location ---
$installDir = Join-Path $env:LOCALAPPDATA $AppName
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
$targetExe = Join-Path $installDir "md-viewer.exe"

# Stop a running instance so the copy doesn't fail with a file lock.
Get-Process -Name "md-viewer" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 300
Copy-Item -Path $ExePath -Destination $targetExe -Force
Write-Host "Copied EXE -> $targetExe"

# Copy the multi-size .ico next to the EXE for crisp file/shell icons.
$icoCandidates = @(
    (Join-Path $scriptDir "appIcon.ico"),
    (Join-Path $projectRoot "appIcon.ico"),
    (Join-Path $projectRoot "resources\icons\appIcon.ico"),
    (Join-Path (Get-Location) "appIcon.ico")
)
$icoSource = $null
foreach ($cand in $icoCandidates) {
    if (Test-Path $cand) {
        $icoSource = $cand
        break
    }
}

$targetIco = Join-Path $installDir "appIcon.ico"
if ($icoSource -and (Test-Path $icoSource)) {
    Copy-Item -Path $icoSource -Destination $targetIco -Force
    # For a .ico file, Windows expects the bare path (WITHOUT ,0)
    $iconRef = "$targetIco"
    Write-Host "Copied icon -> $targetIco"
} else {
    $iconRef = "$targetExe,0"
}
$openCmd    = "`"$targetExe`" `"%1`""
$classesKey = "HKCU:\Software\Classes"

# --- 1) ProgID: describes how to open the file type ---
$progKey = Join-Path $classesKey $ProgId
New-Item -Path $progKey -Force | Out-Null
Set-ItemProperty -Path $progKey -Name "(Default)" -Value "Markdown Document"

New-Item -Path (Join-Path $progKey "DefaultIcon") -Force | Out-Null
Set-ItemProperty -Path (Join-Path $progKey "DefaultIcon") -Name "(Default)" -Value $iconRef

$progCmdKey = Join-Path $progKey "shell\open\command"
New-Item -Path $progCmdKey -Force | Out-Null
Set-ItemProperty -Path $progCmdKey -Name "(Default)" -Value $openCmd

# --- 2) Application entry: makes it show up in the "Open with" list ---
$appKey = Join-Path $classesKey "Applications\md-viewer.exe"
New-Item -Path $appKey -Force | Out-Null
Set-ItemProperty -Path $appKey -Name "FriendlyAppName" -Value $AppName

New-Item -Path (Join-Path $appKey "DefaultIcon") -Force | Out-Null
Set-ItemProperty -Path (Join-Path $appKey "DefaultIcon") -Name "(Default)" -Value $iconRef

$appCmdKey = Join-Path $appKey "shell\open\command"
New-Item -Path $appCmdKey -Force | Out-Null
Set-ItemProperty -Path $appCmdKey -Name "(Default)" -Value $openCmd

$supportedKey = Join-Path $appKey "SupportedTypes"
New-Item -Path $supportedKey -Force | Out-Null
foreach ($ext in $Extensions) {
    Set-ItemProperty -Path $supportedKey -Name $ext -Value ""
}

# --- 3) Register the ProgID against each extension's OpenWithProgids & default ---
foreach ($ext in $Extensions) {
    $extKey = Join-Path $classesKey $ext
    New-Item -Path $extKey -Force | Out-Null
    Set-ItemProperty -Path $extKey -Name "(Default)" -Value $ProgId
    
    # Assign DefaultIcon directly to the extension key so Explorer picks it up immediately
    New-Item -Path (Join-Path $extKey "DefaultIcon") -Force | Out-Null
    Set-ItemProperty -Path (Join-Path $extKey "DefaultIcon") -Name "(Default)" -Value $iconRef

    $owpKey = Join-Path $extKey "OpenWithProgids"
    New-Item -Path $owpKey -Force | Out-Null
    Set-ItemProperty -Path $owpKey -Name $ProgId -Value ([byte[]]@()) -Type None

    # Register in Explorer FileExts for current user
    $fileExtKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$ext"
    New-Item -Path (Join-Path $fileExtKey "OpenWithProgids") -Force | Out-Null
    Set-ItemProperty -Path (Join-Path $fileExtKey "OpenWithProgids") -Name $ProgId -Value ([byte[]]@()) -Type None

    Write-Host "Registered '$ext' -> $ProgId"
}

# --- 4) Create Start Menu Shortcut ---
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
if (Test-Path $startMenuDir) {
    try {
        $wsh = New-Object -ComObject WScript.Shell
        $shortcut = $wsh.CreateShortcut((Join-Path $startMenuDir "$AppName.lnk"))
        $shortcut.TargetPath = $targetExe
        $shortcut.IconLocation = $iconRef
        $shortcut.Description = "MD Viewer - Lightweight Markdown Viewer & Editor"
        $shortcut.WorkingDirectory = $installDir
        $shortcut.Save()
        Write-Host "Created Start Menu shortcut -> $AppName.lnk"
    } catch {
        Write-Warning "Could not create Start Menu shortcut: $_"
    }
}

# --- 5) Notify the shell and refresh icon cache ---
Add-Type -Namespace Win32 -Name Shell -MemberDefinition @"
[System.Runtime.InteropServices.DllImport("shell32.dll")]
public static extern void SHChangeNotify(int eventId, int flags, System.IntPtr item1, System.IntPtr item2);
"@
# SHCNE_ASSOCCHANGED = 0x08000000, SHCNF_IDLIST = 0x0000, SHCNF_FLUSH = 0x1000
[Win32.Shell]::SHChangeNotify(0x08000000, 0x1000, [System.IntPtr]::Zero, [System.IntPtr]::Zero)

Write-Host ""
Write-Host "MD Viewer successfully installed with custom icon!" -ForegroundColor Green
Write-Host "Installed location: $installDir"
