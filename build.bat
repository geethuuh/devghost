@echo off
echo Building DevGhost (C-Native Systems Engine)...
gcc -Wall -Wextra -O2 -Iinclude src\main.c src\diagnostics.c src\ui.c src\executor.c -o devghost.exe
if %ERRORLEVEL% equ 0 (
    echo [OK] Build succeeded: devghost.exe
) else (
    echo [ERROR] Build failed. Make sure gcc is installed.
)
