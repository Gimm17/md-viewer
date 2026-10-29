// scripts/package-release.js
// Packages the standalone EXE, icon, install/uninstall scripts into a ready-to-distribute ZIP for GitHub Releases.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const dist = path.join(root, "dist");
const exeSource = path.join(dist, "md-viewer", "md-viewer-win_x64.exe");
const iconSource = path.join(root, "resources", "icons", "appIcon.ico");
const staging = path.join(dist, "MD-Viewer-v" + pkg.version + "-Windows-x64");
const zipOutput = path.join(dist, `MD-Viewer-v${pkg.version}-Windows-x64.zip`);

if (!fs.existsSync(exeSource)) {
  console.error("Error: Built EXE not found at", exeSource);
  console.error("Run `npm run build` first.");
  process.exit(1);
}

// Clean and recreate staging folder
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
fs.mkdirSync(staging, { recursive: true });

console.log("Staging release files in:", staging);

// Copy EXE as md-viewer.exe
fs.copyFileSync(exeSource, path.join(staging, "md-viewer.exe"));
console.log("  copied md-viewer.exe");

// Copy Icon
if (fs.existsSync(iconSource)) {
  fs.copyFileSync(iconSource, path.join(staging, "appIcon.ico"));
  console.log("  copied appIcon.ico");
}

// Copy install.ps1 & uninstall.ps1
fs.copyFileSync(
  path.join(root, "scripts", "install.ps1"),
  path.join(staging, "install.ps1")
);
fs.copyFileSync(
  path.join(root, "scripts", "uninstall.ps1"),
  path.join(staging, "uninstall.ps1")
);

// Write Install.bat
const installBat = `@echo off
setlocal
title Installing MD Viewer...
cd /d "%~dp0"
echo ===================================================
echo             Installing MD Viewer
echo ===================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] MD Viewer has been installed!
    echo You can now double-click or right-click any .md file to open it.
) else (
    echo.
    echo [ERROR] Installation encountered an issue.
)
echo.
pause
`;
fs.writeFileSync(path.join(staging, "Install.bat"), installBat, "utf8");

// Write Uninstall.bat
const uninstallBat = `@echo off
setlocal
title Uninstalling MD Viewer...
cd /d "%~dp0"
echo ===================================================
echo            Uninstalling MD Viewer
echo ===================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] MD Viewer has been uninstalled.
) else (
    echo.
    echo [ERROR] Uninstall encountered an issue.
)
echo.
pause
`;
fs.writeFileSync(path.join(staging, "Uninstall.bat"), uninstallBat, "utf8");

// Write README.txt
const readmeTxt = `MD Viewer v${pkg.version} - Lightweight Markdown Viewer & Editor (Windows x64)
==============================================================

How to Install:
1. Extract all files from this ZIP to any folder.
2. Double-click "Install.bat".
3. Done! MD Viewer is now installed in your AppData directory,
   added to your Start Menu, and registered to open .md files.

How to Make Default (if needed):
- Right-click any .md file -> "Open with" -> "Choose another app"
- Select "MD Viewer" and check "Always use this app to open .md files".

How to Uninstall:
- Double-click "Uninstall.bat".
`;
fs.writeFileSync(path.join(staging, "README.txt"), readmeTxt, "utf8");

// Create ZIP file using PowerShell Compress-Archive
console.log("Compressing release package to:", zipOutput);
if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

try {
  execSync(
    `powershell.exe -NoProfile -Command "Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipOutput}' -Force"`,
    { stdio: "inherit" }
  );
  console.log("Release ZIP successfully created:", zipOutput);
} catch (err) {
  console.error("Failed to compress archive:", err);
  process.exit(1);
}
