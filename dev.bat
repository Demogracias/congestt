@echo off
title ConGestt Dev Mode
chcp 65001 >nul

echo [1/3] Parando processos nas portas 3000 e 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do taskkill /F /PID %%a 2>nul

echo [2/3] Iniciando Backend (API)...
start /B cmd /c "cd /d %~dp0backend && node dist/index.js"

echo [3/3] Iniciando Frontend (Vite HMR)...
start /B cmd /c "cd /d %~dp0frontend && npx vite"

echo.
echo ========================================
echo   ConGestt - MODO DESENVOLVIMENTO
echo ========================================
echo.
echo   Acessando: http://localhost:3000
echo   API: http://localhost:3001
echo.
echo   Aguardando inicializacao...
timeout /t 5 /nobreak >nul

echo Abrindo navegador...
start http://localhost:3000

echo.
echo Servidores rodando em background. 
echo Para parar, feche esta janela ou use o Gerenciador de Tarefas.
echo ========================================
pause
