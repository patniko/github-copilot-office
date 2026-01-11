#!/bin/bash
# Build script for Windows installer
# Run from repository root on Windows with Git Bash or from macOS/Linux for cross-compilation
# Requires: npm, Inno Setup (on Windows)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR/../.."
BUILD_DIR="$ROOT_DIR/build/windows"
VERSION="1.0.0"

echo "Building Windows installer..."

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Build the frontend
echo "Building frontend..."
cd "$ROOT_DIR"
npm run build

# Build the server executable with pkg
echo "Building server executable for Windows..."
npm exec -- pkg src/server-prod.js \
    --targets node18-win-x64 \
    --output "$BUILD_DIR/copilot-office-server.exe" \
    --compress GZip

echo ""
echo "✓ Windows executable built successfully!"
echo "  Output: $BUILD_DIR/copilot-office-server.exe"
echo ""

# Check if we're on Windows or if Inno Setup is available
if command -v iscc &> /dev/null; then
    echo "Building installer with Inno Setup..."
    iscc "$SCRIPT_DIR/installer.iss"
    echo ""
    echo "✓ Windows installer built successfully!"
    echo "  Output: $BUILD_DIR/CopilotOfficeAddin-Setup-$VERSION.exe"
elif [ -f "/c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    echo "Building installer with Inno Setup..."
    "/c/Program Files (x86)/Inno Setup 6/ISCC.exe" "$SCRIPT_DIR/installer.iss"
    echo ""
    echo "✓ Windows installer built successfully!"
    echo "  Output: $BUILD_DIR/CopilotOfficeAddin-Setup-$VERSION.exe"
else
    echo ""
    echo "Note: Inno Setup not found. Executable built but installer not created."
    echo ""
    echo "To create the installer:"
    echo "1. Install Inno Setup 6 from https://jrsoftware.org/isinfo.php"
    echo "2. Run: iscc installer/windows/installer.iss"
    echo ""
    echo "Alternatively, copy these files to distribute manually:"
    echo "  - build/windows/copilot-office-server.exe"
    echo "  - dist/"
    echo "  - certs/"
    echo "  - manifest.xml"
fi
