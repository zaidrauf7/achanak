@echo off
echo ==========================================
echo      Deploying to Vercel
echo ==========================================
echo.
echo This script will help you deploy your app to Vercel.
echo 1. If you are not logged in, it will ask you to login.
echo 2. It will ask you to link your project.
echo 3. It will build and deploy your application.
echo.
node node_modules/vercel/dist/index.js
echo.
pause
