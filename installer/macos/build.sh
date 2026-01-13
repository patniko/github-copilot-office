#!/bin/bash
# Build script for macOS installer
# Run from repository root: ./installer/macos/build.sh
#
# This script builds an Electron app with a system tray icon.
# The app runs in the background and provides the Office Add-in server.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR/../.."
BUILD_DIR="$ROOT_DIR/build/macos"
ELECTRON_BUILD_DIR="$ROOT_DIR/build/electron"
APP_NAME="GitHub Copilot Office Add-in"
VERSION="1.0.0"
IDENTIFIER="com.github.copilot-office-addin"

echo "Building macOS installer..."

# Ensure we have the icon.icns file
if [ ! -f "$SCRIPT_DIR/icon.icns" ]; then
    echo "Generating icons..."
    cd "$ROOT_DIR"
    npm run build:icons
fi

# Clean extraneous packages and build the Electron app
echo "Building Electron app..."
cd "$ROOT_DIR"
npm run build:electron:mac

# The electron-builder output is in build/electron/mac or build/electron/mac-arm64
echo ""
echo "Electron app built successfully!"

# Find the built app
if [ -d "$ELECTRON_BUILD_DIR/mac-arm64" ]; then
    APP_PATH="$ELECTRON_BUILD_DIR/mac-arm64/$APP_NAME.app"
elif [ -d "$ELECTRON_BUILD_DIR/mac" ]; then
    APP_PATH="$ELECTRON_BUILD_DIR/mac/$APP_NAME.app"
else
    echo "Error: Could not find built app in $ELECTRON_BUILD_DIR"
    exit 1
fi

echo "App location: $APP_PATH"

# Create installer package
echo ""
echo "Creating installer package..."

mkdir -p "$BUILD_DIR"
mkdir -p "$BUILD_DIR/payload/Applications"
mkdir -p "$BUILD_DIR/scripts"

# Copy the app
cp -R "$APP_PATH" "$BUILD_DIR/payload/Applications/"

# Copy LaunchAgent plist
cp "$SCRIPT_DIR/launchagent/com.github.copilot-office-addin.plist" "$BUILD_DIR/payload/Applications/$APP_NAME.app/Contents/Resources/"

# Copy install scripts
cp "$SCRIPT_DIR/scripts/preinstall" "$BUILD_DIR/scripts/"
cp "$SCRIPT_DIR/scripts/postinstall" "$BUILD_DIR/scripts/"
chmod +x "$BUILD_DIR/scripts/preinstall"
chmod +x "$BUILD_DIR/scripts/postinstall"

# Build the component package
echo "Building component package..."
pkgbuild \
    --root "$BUILD_DIR/payload" \
    --scripts "$BUILD_DIR/scripts" \
    --identifier "$IDENTIFIER" \
    --version "$VERSION" \
    --install-location "/" \
    "$BUILD_DIR/CopilotOfficeAddin-component.pkg"

# Create distribution XML
cat > "$BUILD_DIR/distribution.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
    <title>$APP_NAME</title>
    <organization>$IDENTIFIER</organization>
    <domains enable_localSystem="true" enable_currentUserHome="false"/>
    <options customize="never" require-scripts="true" rootVolumeOnly="true"/>
    <welcome file="welcome.html"/>
    <conclusion file="conclusion.html"/>
    <pkg-ref id="$IDENTIFIER"/>
    <choices-outline>
        <line choice="default">
            <line choice="$IDENTIFIER"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="$IDENTIFIER" visible="false">
        <pkg-ref id="$IDENTIFIER"/>
    </choice>
    <pkg-ref id="$IDENTIFIER" version="$VERSION" onConclusion="none">CopilotOfficeAddin-component.pkg</pkg-ref>
</installer-gui-script>
EOF

# Create welcome and conclusion HTML
cat > "$BUILD_DIR/welcome.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
        h1 { color: #24292f; }
        p { color: #57606a; line-height: 1.5; }
        ul { color: #57606a; }
    </style>
</head>
<body>
    <h1>GitHub Copilot Office Add-in</h1>
    <p>This installer will set up the GitHub Copilot Office Add-in on your Mac.</p>
    <p>The installer will:</p>
    <ul>
        <li>Install the add-in application to your Applications folder</li>
        <li>Register the add-in with Word, PowerPoint, and Excel</li>
        <li>Configure the service to start automatically at login</li>
        <li>Add a menu bar icon for easy access</li>
    </ul>
    <p>Click Continue to proceed with the installation.</p>
</body>
</html>
EOF

cat > "$BUILD_DIR/conclusion.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
        h1 { color: #24292f; }
        p { color: #57606a; line-height: 1.5; }
        .success { color: #1a7f37; font-weight: 600; }
    </style>
</head>
<body>
    <h1>Installation Complete!</h1>
    <p class="success">✓ GitHub Copilot Office Add-in has been installed successfully.</p>
    <p>The add-in is now running in your menu bar.</p>
    <p><strong>Next steps:</strong></p>
    <ol>
        <li>Look for the GitHub Copilot icon in your menu bar</li>
        <li>Open Word, PowerPoint, or Excel</li>
        <li>Find the "GitHub Copilot" button on the Home ribbon</li>
        <li>Click the button to open the Copilot panel</li>
    </ol>
    <p>The app will start automatically when you log in.</p>
</body>
</html>
EOF

# Build the final distribution package
echo "Building distribution package..."
productbuild \
    --distribution "$BUILD_DIR/distribution.xml" \
    --resources "$BUILD_DIR" \
    --package-path "$BUILD_DIR" \
    "$BUILD_DIR/CopilotOfficeAddin-$VERSION.pkg"

# Clean up intermediate files
rm -f "$BUILD_DIR/CopilotOfficeAddin-component.pkg"
rm -f "$BUILD_DIR/distribution.xml"
rm -f "$BUILD_DIR/welcome.html"
rm -f "$BUILD_DIR/conclusion.html"
rm -rf "$BUILD_DIR/payload"
rm -rf "$BUILD_DIR/scripts"

echo ""
echo "✓ macOS installer built successfully!"
echo "  Output: $BUILD_DIR/CopilotOfficeAddin-$VERSION.pkg"
echo ""
echo "To sign the package for distribution (optional):"
echo "  productsign --sign 'Developer ID Installer: Your Name' \\"
echo "    '$BUILD_DIR/CopilotOfficeAddin-$VERSION.pkg' \\"
echo "    '$BUILD_DIR/CopilotOfficeAddin-$VERSION-signed.pkg'"
