@echo off
echo Fixing jcenter issues in node_modules...

REM Fix react-native-push-notification
powershell -Command "(Get-Content 'node_modules\react-native-push-notification\android\build.gradle') -replace 'jcenter\(\)', 'mavenCentral()' | Set-Content 'node_modules\react-native-push-notification\android\build.gradle'"

REM Fix @react-native-voice/voice
powershell -Command "(Get-Content 'node_modules\@react-native-voice\voice\android\build.gradle') -replace 'jcenter\(\)', 'mavenCentral()' | Set-Content 'node_modules\@react-native-voice\voice\android\build.gradle'"
powershell -Command "(Get-Content 'node_modules\@react-native-voice\voice\android\build.gradle') -replace 'def DEFAULT_COMPILE_SDK_VERSION = 28', 'def DEFAULT_COMPILE_SDK_VERSION = 34' | Set-Content 'node_modules\@react-native-voice\voice\android\build.gradle'"
powershell -Command "(Get-Content 'node_modules\@react-native-voice\voice\android\build.gradle') -replace 'def DEFAULT_BUILD_TOOLS_VERSION = \"28.0.3\"', 'def DEFAULT_BUILD_TOOLS_VERSION = \"34.0.0\"' | Set-Content 'node_modules\@react-native-voice\voice\android\build.gradle'"
powershell -Command "(Get-Content 'node_modules\@react-native-voice\voice\android\build.gradle') -replace 'def DEFAULT_TARGET_SDK_VERSION = 28', 'def DEFAULT_TARGET_SDK_VERSION = 34' | Set-Content 'node_modules\@react-native-voice\voice\android\build.gradle'"
powershell -Command "(Get-Content 'node_modules\@react-native-voice\voice\android\build.gradle') -replace 'gradle:3.3.2', 'gradle:7.4.2' | Set-Content 'node_modules\@react-native-voice\voice\android\build.gradle'"

echo Done! Fixes applied.
