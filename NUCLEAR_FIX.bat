@echo off
echo ========================================
echo NUCLEAR FIX - Complete Reset
echo ========================================
echo.

echo Stopping all processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM java.exe 2>nul

echo.
echo Deleting EVERYTHING...
rmdir /s /q node_modules 2>nul
rmdir /s /q android\.gradle 2>nul
rmdir /s /q android\app\.cxx 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul
del package-lock.json 2>nul

echo.
echo Reinstalling dependencies...
call npm install

echo.
echo Building Android...
cd android
call gradlew clean assembleDebug --no-daemon
cd ..

echo.
echo ========================================
echo Done! Now run: npx react-native run-android
echo ========================================
pause
