; Custom NSIS scripts for GitHub Copilot Office Add-in
; These run during installation to set up SSL certificates and Office integration

!macro customInstall
  ; Trust the SSL certificate
  DetailPrint "Installing SSL certificate..."
  nsExec::ExecToLog 'certutil -addstore -user Root "$INSTDIR\resources\certs\localhost.pem"'
  
  ; Register the add-in manifest with Office
  DetailPrint "Registering Office Add-in..."
  WriteRegStr HKCU "Software\Microsoft\Office\16.0\WEF\Developer" "CopilotOfficeAddin" "$INSTDIR\resources\manifest.xml"
  
  ; Create startup registry entry to run on login
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "CopilotOfficeAddin" '"$INSTDIR\GitHub Copilot Office Add-in.exe"'
!macroend

!macro customUnInstall
  ; Remove SSL certificate
  DetailPrint "Removing SSL certificate..."
  nsExec::ExecToLog 'certutil -delstore -user Root "localhost"'
  
  ; Remove Office add-in registration
  DeleteRegValue HKCU "Software\Microsoft\Office\16.0\WEF\Developer" "CopilotOfficeAddin"
  
  ; Remove startup entry
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "CopilotOfficeAddin"
  
  ; Kill the running process if any
  nsExec::ExecToLog 'taskkill /F /IM "GitHub Copilot Office Add-in.exe"'
!macroend
