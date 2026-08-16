$apkPath = "C:\Users\purpl\shadowsanctuary\android\app\build\outputs\apk\debug\app-debug.apk"
$env:ANDROID_HOME = "C:\Users\purpl\AppData\Local\Android\Sdk"
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"

Write-Host "Waiting for device..."
while ($true) {
    $devices = & $adb devices
    if ($devices -match "\bdevice\b") {
        Write-Host "Device found. Installing APK..."
        & $adb install -r $apkPath
        
        Write-Host "Launching app..."
        & $adb shell monkey -p com.witchyapp.apothecary -c android.intent.category.LAUNCHER 1
        
        Write-Host "Waiting 8 seconds for app to render login screen..."
        Start-Sleep -Seconds 8
        
        Write-Host "Capturing screenshot..."
        New-Item -ItemType Directory -Force -Path "C:\Users\purpl\shadowsanctuary\docs\proofs" | Out-Null
        & $adb exec-out screencap -p > "C:\Users\purpl\shadowsanctuary\docs\proofs\tablet_login.png"
        
        Write-Host "Starting Livereload Server..."
        # Launch livereload in background
        Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "cap run android --livereload --external"
        
        Write-Host "Waiting 30 seconds for Livereload to sync..."
        Start-Sleep -Seconds 30
        
        Write-Host "Capturing Livereload screenshot..."
        & $adb exec-out screencap -p > "C:\Users\purpl\shadowsanctuary\docs\proofs\tablet_livereload.png"
        
        Write-Host "Done."
        break
    }
    Start-Sleep -Seconds 5
}
