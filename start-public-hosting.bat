@echo off
title Kamui ERP - Cloudflare Public Hosting (Any Network)
echo ===================================================================
echo   KAMUI ENTERPRISE ERP // CRIMSON PROTOCOL
echo   Local Hosting with Global Cloudflare Tunnel (Any Network)
echo ===================================================================
echo Starting Cloudflare edge tunnel to local port 5173...
echo.
npx -y cloudflared tunnel --url http://127.0.0.1:5173
pause
