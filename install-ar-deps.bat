@echo off
echo Installing AR dependencies for Pokemon GO-style experience...

echo.
echo Installing react-native-sensors...
npm install react-native-sensors@^7.3.6

echo.
echo Linking iOS dependencies...
cd ios
pod install
cd ..

echo.
echo AR dependencies installed successfully!
echo.
echo Next steps:
echo 1. Run: npm start
echo 2. Run: npm run android (or npm run ios)
echo 3. Go to AR tab and tap "Spawn Pokemon"
echo 4. Move your device around to see Pokemon stay in world positions!
echo.
pause