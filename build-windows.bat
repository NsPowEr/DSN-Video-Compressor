@echo off
SETLOCAL

:: --- CONFIGURAZIONE ---
SET "APP_NAME_BASE=video-compressor"
SET "BUILD_DIR=build\bin"

echo 🧹 Pulizia cartella build...
if exist "%BUILD_DIR%" rd /s /q "%BUILD_DIR%"
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

:: --- BUILD SECTION ---
echo.
echo 🔨 Inizio compilazione Windows...

:: 1. Build Windows AMD64 (Standard x64)
echo.
echo 🪟 Building for Windows (x64 - Standard)...
wails build -platform windows/amd64 -o "%APP_NAME_BASE%-amd64.exe"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Errore durante la build AMD64
    GOTO :Error
)

:: 2. Build Windows ARM64 (Snapdragon / Surface)
echo.
echo 🪟 Building for Windows (ARM64)...
wails build -platform windows/arm64 -o "%APP_NAME_BASE%-arm64.exe"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Errore durante la build ARM64
    GOTO :Error
)

:: --- ZIPPING SECTION ---
echo.
echo 📦 Creazione archivi ZIP...

:: Zip per AMD64
if exist "%BUILD_DIR%\%APP_NAME_BASE%-amd64.exe" (
    echo    - Zippando versione AMD64...
    powershell -Command "Compress-Archive -Path '%BUILD_DIR%\%APP_NAME_BASE%-amd64.exe' -DestinationPath '%APP_NAME_BASE%-windows-amd64.zip' -Force"
)

:: Zip per ARM64
if exist "%BUILD_DIR%\%APP_NAME_BASE%-arm64.exe" (
    echo    - Zippando versione ARM64...
    powershell -Command "Compress-Archive -Path '%BUILD_DIR%\%APP_NAME_BASE%-arm64.exe' -DestinationPath '%APP_NAME_BASE%-windows-arm64.zip' -Force"
)

echo.
echo ---------------------------------------------------
echo 🎉 Procedura Windows completata con successo.
echo I file zip si trovano nella cartella del progetto.
pause
EXIT /B 0

:Error
echo.
echo ❌ Il processo e' fallito.
pause
EXIT /B 1