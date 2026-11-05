# FileForge ilk kurulum betigi (Windows).
# Kullanim: setup.cmd dosyasina cift tiklayin veya bu dosyayi PowerShell'de calistirin.
#
# Yaptiklari:
#   1. Node.js kurulu mu diye kontrol eder
#   2. frontend bagimliliklarini kurar (npm install)
#   3. Uretim derlemesini olusturur (npm run build)
#   4. Masaustune FileForge kisayolunu ekler

$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $rootDir 'frontend'

function Write-Step($text) {
  Write-Host ""
  Write-Host "==> $text" -ForegroundColor Cyan
}

Write-Host "FileForge kurulumu" -ForegroundColor Yellow
Write-Host "Proje klasoru: $rootDir"

Write-Step "Node.js kontrol ediliyor"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host ""
  Write-Host "Node.js bulunamadi." -ForegroundColor Red
  Write-Host "Lutfen https://nodejs.org adresinden Node.js 18 veya uzerini kurun,"
  Write-Host "kurulumdan sonra bu pencereyi kapatip setup.cmd dosyasini yeniden calistirin."
  Read-Host "Kapatmak icin Enter'a basin"
  exit 1
}
$nodeVersion = (& node --version).TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
Write-Host "Node.js $nodeVersion bulundu."
if ($nodeMajor -lt 18) {
  Write-Host "Node.js 18 veya uzeri gerekli. Lutfen guncelleyin." -ForegroundColor Red
  Read-Host "Kapatmak icin Enter'a basin"
  exit 1
}

Write-Step "Bagimliliklar kuruluyor (npm install)"
Push-Location $frontendDir
try {
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install basarisiz oldu (kod: $LASTEXITCODE)" }

  Write-Step "Uygulama derleniyor (npm run build)"
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build basarisiz oldu (kod: $LASTEXITCODE)" }
}
finally {
  Pop-Location
}

Write-Step "Masaustu kisayolu olusturuluyor"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $rootDir 'launcher\install-shortcut.ps1')

Write-Host ""
Write-Host "Kurulum tamamlandi." -ForegroundColor Green
Write-Host "Masaustundeki 'FileForge' kisayoluna cift tiklayarak uygulamayi acabilirsiniz."
Read-Host "Kapatmak icin Enter'a basin"
