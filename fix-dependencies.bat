@echo off
echo Fixing PokeExplorer dependencies...

echo.
echo 1. Cleaning node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist yarn.lock del yarn.lock

echo.
echo 2. Installing compatible dependencies...
npm install

echo.
echo 3. Cleaning Android build...
cd android
call gradlew clean
cd ..

echo.
echo 4. Cleaning iOS build (if exists)...
if exist ios (
    cd ios
    if exist Pods rmdir /s /q Pods
    if exist Podfile.lock del Podfile.lock
    cd ..
)

echo.
echo 5. Resetting Metro cache...
npx react-native start --reset-cache

echo.
echo Dependencies fixed! You can now run:
echo   npm run android
echo   or
echo   npm run ios