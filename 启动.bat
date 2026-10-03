@echo off
chcp 65001 >nul
title 智观3D - 本地服务
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] 未找到 Python,请先安装 Python 或直接把 know3d 文件夹放到任何静态服务器上。
  pause
  exit /b 1
)
echo 正在启动智观3D(浏览器将自动打开)...
python serve.py
pause
