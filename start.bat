@echo off
title ConGestt Server
chcp 65001 >nul

cd /d "%~dp0backend"

if not exist .env (
  echo [Setup] Criando .env com valores padrao...
  copy .env.example .env >nul
)

if not exist "node_modules\express" (
  echo [ERRO] Execute setup.bat primeiro ou: npm install
  pause & exit /b 1
)

if not exist "..\frontend\dist\index.html" (
  echo [Setup] Compilando frontend...
  cd /d "%~dp0frontend"
  call npm run build >nul 2>&1
  if errorlevel 1 ( echo [ERRO] Build frontend & pause & exit /b 1 )
  cd /d "%~dp0backend"
)

:: Pega IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do set ip=%%a
set ip=%ip: =%

echo ========================================
echo   ConGestt - Servidor Unificado
echo ========================================
echo.
echo   Local: http://localhost:3001
echo   Rede:  http://%ip%:3001
echo.
echo   Login: admin@congestt.com / 123
echo   Ctrl+C para parar
echo ========================================
echo.

if exist "dist\index.js" (
  node dist/index.js
) else (
  npx ts-node-dev --respawn --transpile-only src/index.ts
)
