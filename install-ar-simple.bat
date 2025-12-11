@echo off
echo Setting up simplified AR experience...

echo.
echo Cleaning previous installation...
npm uninstall react-native-sensors

echo.
echo Installing dependencies...
npm install

echo.
echo Setting up iOS (if needed)...
cd ios
pod install
cd ..

echo.
echo AR setup complete!
echo.
echo The AR experience now uses:
echo - Simulated device rotation for Pokemon positioning
echo - World-based coordinate system
echo - Pokemon stay in fixed positions as you "look around"
echo.
echo To test:
echo 1. Run: npm start
echo 2. Run: npm run android (or npm run ios)
echo 3. Go to AR tab and spawn Pokemon
echo 4. Pokemon will move slightly to simulate looking around
echo.
pause