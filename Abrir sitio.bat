@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  start "" "%~dp0index.html"
  exit /b
)
start "Servidor autonomia" /min cmd /c "python -m http.server 8080"
timeout /t 2 >nul
start "" "http://localhost:8080/"
echo Sitio abierto en http://localhost:8080/
echo Para detenerlo, cierra la ventana minimizada "Servidor autonomia".
pause
