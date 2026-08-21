Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command ""& 'C:\Program Files\nodejs\node.exe' 'C:\Users\vitor\antigravity\VOS-Condomínios---CRM-&-ERP\node_modules\vite\bin\vite.js' --port 3000 --host 0.0.0.0""", 0, False
