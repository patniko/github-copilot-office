#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MANIFEST_PATH="$SCRIPT_DIR/manifest.xml"
CERT_PATH="$SCRIPT_DIR/certs/localhost.pem"

echo -e "\033[36mSetting up Office Add-in for development on macOS...\033[0m"
echo ""

# Step 1: Trust the SSL certificate
echo -e "\033[33mStep 1: Trusting development SSL certificate...\033[0m"

if [ ! -f "$CERT_PATH" ]; then
    echo -e "\033[31mError: Certificate not found at $CERT_PATH\033[0m"
    echo -e "\033[31mCertificates are required for HTTPS. Please ensure certs are in the repository.\033[0m"
    exit 1
fi

# Check if certificate is already trusted
if security find-certificate -c "localhost" -a -Z | grep -q "$(openssl x509 -in "$CERT_PATH" -fingerprint -noout | cut -d= -f2)"; then
    echo -e "  \033[32m✓ Certificate already trusted\033[0m"
else
    # Add certificate to keychain (requires user password)
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_PATH"
    echo -e "  \033[32m✓ Certificate trusted\033[0m"
fi

echo ""

# Step 2: Register manifest for Word, PowerPoint, and Excel
echo -e "\033[33mStep 2: Registering add-in manifest...\033[0m"
echo "  Manifest: $MANIFEST_PATH"

# Create directories for Word, PowerPoint, and Excel if they don't exist
WORD_WEF_DIR="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
POWERPOINT_WEF_DIR="$HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"
EXCEL_WEF_DIR="$HOME/Library/Containers/com.microsoft.Excel/Data/Documents/wef"

mkdir -p "$WORD_WEF_DIR"
mkdir -p "$POWERPOINT_WEF_DIR"
mkdir -p "$EXCEL_WEF_DIR"

# Copy manifest to all directories
cp "$MANIFEST_PATH" "$WORD_WEF_DIR/"
cp "$MANIFEST_PATH" "$POWERPOINT_WEF_DIR/"
cp "$MANIFEST_PATH" "$EXCEL_WEF_DIR/"

echo -e "  \033[32m✓ Add-in registered for Word\033[0m"
echo -e "  \033[32m✓ Add-in registered for PowerPoint\033[0m"
echo -e "  \033[32m✓ Add-in registered for Excel\033[0m"
echo ""

echo -e "\033[36mSetup complete! Next steps:\033[0m"
echo "1. Close Word, PowerPoint, and Excel if they are open"
echo "2. Start the dev server: npm run dev"
echo "3. Open Word, PowerPoint, or Excel"
echo "4. Look for 'Copilot Agent' button on the Home ribbon"
echo ""
echo -e "\033[90mTo unregister, run: ./unregister.sh\033[0m"
