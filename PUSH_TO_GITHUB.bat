@echo off
TITLE Push Madhurai Chocolate to GitHub
COLOR 0B

echo ===================================================
echo   Pushing Madhurai Chocolate Platform to GitHub
echo ===================================================
echo.
echo Target: https://github.com/SrivardhabReddy/madhurai-chocolate
echo Branch: main
echo.

cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"

git remote remove origin 2>nul
git remote add origin https://github.com/SrivardhabReddy/madhurai-chocolate.git

echo Uploading project files to GitHub...
echo (If prompted, enter your GitHub Username and Personal Access Token)
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo  SUCCESS! Your code is now live on GitHub!
    echo ===================================================
    echo Next step: Connect your repository on Render.com
) else (
    echo.
    echo ===================================================
    echo If authentication failed:
    echo GitHub requires a Personal Access Token (PAT).
    echo You can generate one at: https://github.com/settings/tokens
    echo ===================================================
)

echo.
pause
