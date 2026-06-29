@echo off
echo ========================================
echo   ConGestt - Setup Inicial
echo ========================================
echo.
echo [1/4] Instalando dependencias do Backend...
cd /d "%~dp0backend"
call npm install --no-fund --no-audit
if %errorlevel% neq 0 (
  echo ERRO no npm install backend
  pause
  exit /b 1
)
echo OK.
echo.

echo [2/4] Instalando dependencias do Frontend...
cd /d "%~dp0frontend"
call npm install --no-fund --no-audit
if %errorlevel% neq 0 (
  echo ERRO no npm install frontend
  pause
  exit /b 1
)
echo OK.
echo.

echo [3/4] Compilando Frontend (vite build)...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
  echo ERRO no build frontend
  pause
  exit /b 1
)
echo OK.
echo.

echo [4/4] Compilando Backend (TypeScript)...
cd /d "%~dp0backend"
call npm run build
if %errorlevel% neq 0 (
  echo ERRO no build backend
  pause
  exit /b 1
)
echo OK.
echo.

echo ========================================
echo   Setup Concluido com sucesso!
echo.
echo   Para iniciar execute: start.bat
echo   Acessar: http://localhost:3001
echo   Login: admin@congestt.com / 123
echo ========================================
echo.
pause
