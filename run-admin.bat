@echo off
echo Network Monitor & Analysis Tool
echo ================================
echo.
echo This application requires Administrator privileges to capture packets.
echo.
echo Starting application...
echo.

powershell -Command "Start-Process npm -ArgumentList 'start' -Verb RunAs"
