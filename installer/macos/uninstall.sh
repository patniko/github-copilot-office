#!/bin/bash
# Uninstall script for macOS
# Run: sudo ./uninstall.sh

APP_NAME="GitHub Copilot Office Add-in"
APP_DIR="/Applications/$APP_NAME.app"
LAUNCHAGENT="com.github.copilot-office-addin"

echo "Uninstalling GitHub Copilot Office Add-in..."

# Get the current user
if [ -n "$SUDO_USER" ]; then
    INSTALL_USER="$SUDO_USER"
else
    INSTALL_USER=$(stat -f "%Su" /dev/console)
fi

USER_HOME=$(dscl . -read /Users/$INSTALL_USER NFSHomeDirectory | awk '{print $2}')

# Stop the service
echo "Stopping service..."
LAUNCHAGENT_PATH="$USER_HOME/Library/LaunchAgents/$LAUNCHAGENT.plist"
if [ -f "$LAUNCHAGENT_PATH" ]; then
    sudo -u $INSTALL_USER launchctl unload "$LAUNCHAGENT_PATH" 2>/dev/null || true
    rm -f "$LAUNCHAGENT_PATH"
fi

# Kill any running Electron app
pkill -f "$APP_NAME" 2>/dev/null || true

# Also kill any old standalone server process (from previous versions)
pkill -f "copilot-office-server" 2>/dev/null || true

# Remove add-in registrations
echo "Removing add-in registrations..."
WORD_WEF="$USER_HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
PPT_WEF="$USER_HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"
EXCEL_WEF="$USER_HOME/Library/Containers/com.microsoft.Excel/Data/Documents/wef"

for WEF_DIR in "$WORD_WEF" "$PPT_WEF" "$EXCEL_WEF"; do
    rm -f "$WEF_DIR/manifest.xml" 2>/dev/null || true
done

# Remove application directory
echo "Removing application..."
rm -rf "$APP_DIR"

echo ""
echo "✓ GitHub Copilot Office Add-in has been uninstalled."
echo ""
echo "Note: The SSL certificate remains in your keychain."
echo "To remove it manually:"
echo "  1. Open Keychain Access"
echo "  2. Search for 'localhost'"
echo "  3. Delete the certificate"
