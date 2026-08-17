@echo off
title La Visual MK - Servidor Local YouTube a MP3
color 0A
cls
echo ========================================================
echo   LA VISUAL MK - INICIADOR AUTOMATICO DE SERVIDOR MP3
echo ========================================================
echo.
echo 1. Comprobando y actualizando yt-dlp a la ultima version anti-403...
python -m pip install --upgrade yt-dlp flask flask-cors
echo.
echo ========================================================
echo 2. Iniciando servidor en http://127.0.0.1:5057 ...
echo    (Manten esta ventana abierta mientras usas la app)
echo ========================================================
echo.
python yt2mp3_server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Hubo un problema al iniciar el servidor.
    echo Asegurate de tener Python instalado y anadido al PATH de Windows.
    pause
)
