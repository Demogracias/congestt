@echo off
title ConGestt Backup
chcp 65001 >nul
cd /d "%~dp0"

if not exist "data\congestt.db" (
  echo [Backup] Nenhum banco encontrado em data/
  pause & exit /b 1
)

if not exist "backups\" mkdir backups

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set dt=%%a
set ts=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%%dt:~10,2%

echo [Backup] Criando backup de data\ para backups\congestt_%ts%\...

mkdir "backups\congestt_%ts%" 2>nul
xcopy /E /I /Y data\ "backups\congestt_%ts%\" >nul

echo [Backup] Backup concluído: backups\congestt_%ts%
pause
