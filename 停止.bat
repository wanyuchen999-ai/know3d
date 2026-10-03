@echo off
chcp 65001 >nul
echo 正在停止智观3D服务...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter "Name=python.exe" | Where-Object { $_.CommandLine -match serve.py } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo 已停止。
pause
