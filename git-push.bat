@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

title Git Auto Push

call :msg Cyan "========================================"
call :msg Cyan "           GIT AUTO PUSH TOOL           "
call :msg Cyan "========================================"
echo.

where git >nul 2>nul
if errorlevel 1 (
    call :msg Red "[ОШИБКА] Git не найден в системе."
    pause
    exit /b 1
)

if not exist ".git" (
    call :msg Red "[ОШИБКА] Здесь нет git-репозитория (.git не найден)."
    pause
    exit /b 1
)

call :msg Yellow "[ПРОВЕРКА] Соединение с GitHub..."
ping -n 1 github.com >nul
if errorlevel 1 (
    call :msg Red "[ОШИБКА] Нет соединения с GitHub."
    pause
    exit /b 1
) else (
    call :msg Green "[OK] GitHub доступен."
)

echo.
for /f "delims=" %%i in ('git branch --show-current') do set BRANCH=%%i
call :msg Yellow "[ИНФО] Текущая ветка:"
call :msg Cyan "  !BRANCH!"

echo.
call :msg Yellow "[ИНФО] Проверка локальных изменений..."
git diff --quiet
set DIFF_WORK=%errorlevel%
git diff --cached --quiet
set DIFF_STAGE=%errorlevel%

if "!DIFF_WORK!"=="0" if "!DIFF_STAGE!"=="0" (
    call :msg DarkGray "  Нет новых изменений."
) else (
    call :msg Green "  Есть изменения для коммита."
)

echo.
call :msg Yellow "[ШАГ 1] Синхронизация с GitHub..."
git fetch origin >nul 2>nul
if errorlevel 1 (
    call :msg Red "[ОШИБКА] Не удалось получить данные из origin."
    pause
    exit /b 1
)

for /f %%i in ('git rev-list --count HEAD..origin/main') do set BEHIND=%%i
for /f %%i in ('git rev-list --count origin/main..HEAD') do set AHEAD=%%i

if "!BEHIND!"=="0" (
    call :msg Green "  Локальная ветка не отстаёт от origin/main."
) else (
    call :msg Yellow "  Локальная ветка отстаёт на !BEHIND! коммит(ов)."
)

if "!AHEAD!"=="0" (
    call :msg DarkGray "  Локальная ветка пока не опережает origin/main."
) else (
    call :msg Cyan "  Локальная ветка опережает origin/main на !AHEAD! коммит(ов)."
)

git pull --rebase origin main
if errorlevel 1 (
    call :msg Red "[ОШИБКА] git pull --rebase не выполнился."
    call :msg Yellow "Скорее всего, конфликт. Выполни: git status"
    pause
    exit /b 1
)
call :msg Green "[OK] Синхронизация завершена."

echo.
call :msg Yellow "[ШАГ 2] Добавление файлов..."
git add .
if errorlevel 1 (
    call :msg Red "[ОШИБКА] git add не выполнился."
    pause
    exit /b 1
)
call :msg Green "[OK] Файлы добавлены."

echo.
call :msg Yellow "[ШАГ 3] Проверка, есть ли что коммитить..."
git diff --cached --quiet
if %errorlevel%==0 (
    call :msg DarkGray "  Нет новых изменений после git add."
    call :msg Cyan "  Пуш не нужен."
    echo.
    pause
    exit /b 0
)

for /f "tokens=1-3 delims=.-/ " %%a in ("%date%") do (
    set D1=%%a
    set D2=%%b
    set D3=%%c
)
for /f "tokens=1-2 delims=:." %%a in ("%time%") do (
    set T1=%%a
    set T2=%%b
)

set MSG=update !D3!-!D2!-!D1! !T1!-!T2!

call :msg Yellow "[ШАГ 4] Создание коммита..."
call :msg Cyan "  !MSG!"
git commit -m "!MSG!"
if errorlevel 1 (
    call :msg Red "[ОШИБКА] Не удалось создать коммит."
    pause
    exit /b 1
)
call :msg Green "[OK] Коммит создан."

echo.
call :msg Yellow "[ШАГ 5] Пуш в GitHub..."
git push origin main
if errorlevel 1 (
    call :msg Red "[ОШИБКА] git push не выполнился."
    pause
    exit /b 1
)
call :msg Green "[OK] Пуш выполнен."

echo.
call :msg Cyan "========================================"
call :msg Green "           ГОТОВО. ВСЁ УСПЕШНО          "
call :msg Cyan "========================================"
echo.
call :msg Yellow "GitHub Actions:"
echo https://github.com/ivanseremet22/ignitechat/actions
echo.
pause
exit /b 0

:msg
powershell -NoProfile -Command "Write-Host '%~2' -ForegroundColor %1"
exit /b