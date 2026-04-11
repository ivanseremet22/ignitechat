@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo.
echo ==============================
echo   GIT AUTO PUSH
echo ==============================
echo.

echo [1/4] Синхронизация с GitHub...
git pull --rebase origin main
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Не удалось сделать git pull --rebase
    echo Проверь конфликт или интернет.
    pause
    exit /b 1
)

echo.
echo [2/4] Добавление файлов...
git add .
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Не удалось выполнить git add .
    pause
    exit /b 1
)

echo.
echo [3/4] Создание коммита...
for /f "tokens=1-3 delims=./-" %%a in ("%date%") do set d1=%%a& set d2=%%b& set d3=%%c
for /f "tokens=1-2 delims=:." %%a in ("%time%") do set t1=%%a& set t2=%%b

set commit_msg=update %d3%-%d2%-%d1% %t1%-%t2%

git diff --cached --quiet
if %errorlevel%==0 (
    echo Нет изменений для коммита.
) else (
    git commit -m "%commit_msg%"
    if errorlevel 1 (
        echo.
        echo [ОШИБКА] Не удалось создать коммит.
        pause
        exit /b 1
    )
)

echo.
echo [4/4] Отправка в GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Не удалось выполнить git push.
    pause
    exit /b 1
)

echo.
echo ==============================
echo   ГОТОВО. PUSH УСПЕШЕН
echo ==============================
echo.
pause