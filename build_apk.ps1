$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\purpl\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;" + $env:PATH

cd C:\Users\purpl\shadowsanctuary
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

cd android
./gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "Build Successful"
