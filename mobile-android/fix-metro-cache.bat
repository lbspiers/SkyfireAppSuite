@echo off
echo ========================================
echo Fixing Metro Cache and Environment Issues
echo ========================================

echo.
echo Step 1: Killing any running Metro processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing Metro cache...
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\haste-map-* 2>nul

echo.
echo Step 3: Clearing React Native cache...
npx react-native start --reset-cache --max-workers=1 &
timeout /t 5 >nul
taskkill /F /IM node.exe 2>nul

echo.
echo Step 4: Clearing watchman (if exists)...
watchman watch-del-all 2>nul

echo.
echo Step 5: Clearing Android build cache...
cd android
call gradlew clean
cd ..

echo.
echo ========================================
echo Cache clearing complete!
echo ========================================
echo.
echo Now run: npx react-native run-android
echo.
pause