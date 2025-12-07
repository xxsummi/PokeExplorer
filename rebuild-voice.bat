@echo off
echo Cleaning Android build...
cd android
call gradlew.bat clean
cd ..
echo Rebuilding app...
npx react-native run-android
