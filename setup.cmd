@echo off
rem FileForge ilk kurulum - cift tiklayarak calistirin.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 pause
