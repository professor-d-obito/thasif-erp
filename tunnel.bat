@echo off
title Kamui ERP - Persistent Network Tunnel
echo ===================================================
echo [KAMUI ERP] Starting Persistent Public Tunnel
echo Port: 5173
echo Subdomain: kamui-erp-live
echo Tunnel URL: https://kamui-erp-live.loca.lt
echo Localtunnel Password: Visit https://loca.lt/mytunnelpassword from host browser
echo ===================================================
:loop
npx -y localtunnel --port 5173 --subdomain kamui-erp-live
echo [%time%] Tunnel disconnected. Reconnecting in 2 seconds...
timeout /t 2 /nobreak >nul
goto loop
