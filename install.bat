@echo off
REM 🎼 Zyrkom Windows Auto-Install Script
REM Makes the project completely plug-and-play on Windows

echo 🎼 Installing Zyrkom Zero-Knowledge Musical Physics Framework...
echo ==========================================================

REM Check if Rust is installed
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Rust not found. Please install from https://rustup.rs/
    echo Then run this script again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Rust found
)

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js found
)

REM Setup Rust nightly
echo [STEP] Setting up Rust nightly...
rustup install nightly
rustup default nightly

REM Build Zyrkom core
echo [STEP] Building Zyrkom core engine...
cd zyrkom
cargo clean
cargo test --lib
cargo build --release
cd ..
echo [SUCCESS] Zyrkom core built

REM Setup frontend
echo [STEP] Setting up Matrix UI frontend...
cd zyrkom-ui
npm install
npm run build
cd ..
echo [SUCCESS] Frontend setup complete

REM Install Tauri CLI
echo [STEP] Installing Tauri CLI...
cargo install tauri-cli --version "^2.0"

REM Create Windows launch scripts
echo [STEP] Creating launch scripts...

REM Development launch script
echo @echo off > launch-dev.bat
echo echo 🎼 Launching Zyrkom Matrix UI (Development Mode) >> launch-dev.bat
echo cd zyrkom-ui >> launch-dev.bat
echo npm run tauri dev >> launch-dev.bat

REM Production launch script
echo @echo off > launch-prod.bat
echo echo 🎼 Launching Zyrkom Matrix UI (Production Mode) >> launch-prod.bat
echo cd zyrkom-ui >> launch-prod.bat
echo npm run tauri build >> launch-prod.bat
echo echo Build complete! Check zyrkom-ui/src-tauri/target/release/ for the executable >> launch-prod.bat

REM Test script
echo @echo off > run-tests.bat
echo echo 🧪 Running all Zyrkom tests... >> run-tests.bat
echo cd zyrkom >> run-tests.bat
echo echo Running core tests... >> run-tests.bat
echo cargo test --lib >> run-tests.bat
echo echo Running audio tests (with sound)... >> run-tests.bat
echo cargo test --lib --features test-audio -- --nocapture >> run-tests.bat
echo cd .. >> run-tests.bat

echo.
echo 🎉 INSTALLATION COMPLETE!
echo ========================
echo.
echo 🚀 Quick Start Commands:
echo   launch-dev.bat      # Start Matrix UI (development)
echo   launch-prod.bat     # Build production version
echo   run-tests.bat       # Run all tests with audio
echo.
echo 🎵 What you can do now:
echo   1. Run 'launch-dev.bat' to see the Matrix-style UI
echo   2. Run 'run-tests.bat' to hear ZK proofs as audio
echo   3. Edit files in zyrkom/src/ for core engine changes
echo   4. Edit files in zyrkom-ui/src/ for UI changes
echo.
echo 🎼 Happy zero-knowledge musical proving!
pause 