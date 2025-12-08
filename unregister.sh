#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MANIFEST_FILENAME="manifest.xml"

echo -e "\033[36mUnregistering Office Add-in from macOS...\033[0m"
echo ""

# Define directories
WORD_WEF_DIR="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
POWERPOINT_WEF_DIR="$HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"
EXCEL_WEF_DIR="$HOME/Library/Containers/com.microsoft.Excel/Data/Documents/wef"

# Remove manifest from Word directory
if [ -f "$WORD_WEF_DIR/$MANIFEST_FILENAME" ]; then
    rm "$WORD_WEF_DIR/$MANIFEST_FILENAME"
    echo -e "  \033[32m✓ Removed add-in from Word\033[0m"
else
    echo -e "  \033[90m• Add-in not found in Word directory\033[0m"
fi

# Remove manifest from PowerPoint directory
if [ -f "$POWERPOINT_WEF_DIR/$MANIFEST_FILENAME" ]; then
    rm "$POWERPOINT_WEF_DIR/$MANIFEST_FILENAME"
    echo -e "  \033[32m✓ Removed add-in from PowerPoint\033[0m"
else
    echo -e "  \033[90m• Add-in not found in PowerPoint directory\033[0m"
fi

# Remove manifest from Excel directory
if [ -f "$EXCEL_WEF_DIR/$MANIFEST_FILENAME" ]; then
    rm "$EXCEL_WEF_DIR/$MANIFEST_FILENAME"
    echo -e "  \033[32m✓ Removed add-in from Excel\033[0m"
else
    echo -e "  \033[90m• Add-in not found in Excel directory\033[0m"
fi

echo ""
echo -e "\033[36mUnregistration complete!\033[0m"
echo "Note: The SSL certificate remains in the system keychain."
echo "To remove it, use Keychain Access app and search for 'localhost'."
echo ""
echo -e "\033[90mTo re-register, run: ./register.sh\033[0m"
