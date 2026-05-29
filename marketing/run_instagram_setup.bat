@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ============================================================
echo  Instagram Graph API 토큰 발급 스크립트
echo ============================================================
echo.
python setup_instagram_oauth.py
echo.
pause
