@echo off
echo Clearing all build caches...

REM Kill any running Node processes
taskkill /F /IM node.exe >nul 2>&1

REM Clear ESLint cache
if exist .eslintcache del /F /Q .eslintcache

REM Clear node_modules cache
if exist node_modules\.cache rmdir /S /Q node_modules\.cache

REM Clear build directory
if exist build rmdir /S /Q build

REM Clear Babel cache
if exist node_modules\.cache\babel-loader rmdir /S /Q node_modules\.cache\babel-loader

REM Clear temp files
if exist %TEMP%\react-* rmdir /S /Q %TEMP%\react-*

echo Cache cleared successfully!
echo.
echo Now run: npm run build
