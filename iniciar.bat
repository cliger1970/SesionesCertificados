@echo off
setlocal enabledelayedexpansion
title EduSuite Pro - Lanzador Automatico
color 0B

echo ======================================================================
echo           EDUSUITE PRO - LANZADOR AUTOMATICO (UN SOLO CLIC)
echo ======================================================================
echo.

:: 1. Verificar si Node.js esta instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js no esta detectado en tu equipo.
    echo [*] Instalando Node.js automaticamente con winget...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se pudo instalar automaticamente.
        echo Por favor descarga e instala Node.js manualmente desde: https://nodejs.org
        pause
        exit /b 1
    )
    echo [OK] Node.js instalado.
    echo [*] Actualizando variables de entorno temporales...
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
) else (
    echo [OK] Node.js detectado correctamente.
)

echo.
:: 2. Verificar dependencias de la aplicacion (node_modules)
if not exist "node_modules\" (
    echo [*] Primera ejecucion detectada: Instalando librerias del sistema...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error durante la instalacion de dependencias.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas con exito.
) else (
    echo [OK] Dependencias ya instaladas.
)

echo.
:: 3. Verificar si el build de produccion existe
if not exist ".next\" (
    echo [*] Compilando la aplicacion para maxima velocidad...
    call npm run build
)

echo.
echo ======================================================================
echo  Iniciando EduSuite Pro...
echo  Abriendo tu navegador en: http://localhost:3000
echo ======================================================================
echo.

:: 4. Abrir el navegador automaticamente tras 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 5. Iniciar la aplicacion
call npm run start -- -p 3000

pause
