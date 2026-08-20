@echo off
setlocal
set "UNITY_EDITOR=C:\Program Files\Unity\Hub\Editor\2022.3.62f1\Editor\Unity.exe"
if not exist "%UNITY_EDITOR%" (
  echo Unity 2022.3.62f1 bulunamadi.
  exit /b 1
)
"%UNITY_EDITOR%" -batchmode -quit -projectPath "%~dp0.." -executeMethod BuyuluKazan.Editor.WebGLBuilder.Build -logFile "%~dp0..\webgl-build.log"
if errorlevel 1 (
  echo Build basarisiz. webgl-build.log dosyasini kontrol edin.
  exit /b 1
)
echo WebGL surumu WebGLBuild klasorunde hazir.
