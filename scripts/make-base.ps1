# Genera bases/hydrogreen-base-AAAA-MM-DD.zip con el proyecto completo para el equipo.
# Excluye node_modules, .next, .env* (salvo .env.example), .git, entregas/, bases/, prototipo/ y secretos.
# Uso (desde la raíz del proyecto):  powershell -ExecutionPolicy Bypass -File scripts\make-base.ps1
param([string]$Date = (Get-Date -Format 'yyyy-MM-dd'))

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'bases'
New-Item -ItemType Directory -Force $outDir | Out-Null
# tar.exe de Windows (bsdtar); el de Git Bash no entiende rutas C:\
$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
$zip = Join-Path $outDir "hydrogreen-base-$Date.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }

Push-Location $root
try {
  # Se pasan los elementos de primer nivel por nombre (no '.'): con '.' las rutas del zip empiezan con './'
  # y el Explorador de Windows lo muestra vacío.
  $skipTop = @('.git', 'bases', 'entregas', 'prototipo', '.vercel', 'coverage')
  $items = Get-ChildItem -Force -LiteralPath $root |
    Where-Object { $skipTop -notcontains $_.Name -and $_.Extension -ne '.pdf' } |
    ForEach-Object { $_.Name }
  # tar.exe (bsdtar, incluido en Windows 10+) escribe zips con rutas '/' y permite excluir.
  & $tar -a -c -f $zip `
    --exclude=node_modules --exclude=.next --exclude=.git --exclude='*.tsbuildinfo' `
    --exclude=.env --exclude='.env.local' --exclude='.env.*.local' --exclude='.env.development' --exclude='.env.production' `
    --exclude=./entregas --exclude=./bases --exclude=./prototipo --exclude=arduino_secrets.h `
    --exclude='*.pdf' --exclude=.vercel --exclude=coverage `
    $items
  if ($LASTEXITCODE -ne 0) { throw "tar falló con código $LASTEXITCODE" }
} finally {
  Pop-Location
}

# Verificación: ningún archivo prohibido dentro del zip
$bad = & $tar -t -f $zip | Select-String -Pattern '(^|/)(node_modules|\.next|\.git|entregas)/|(^|/)\.env(?!\.example$)|arduino_secrets\.h'
if ($bad) {
  Write-Error "El zip contiene archivos prohibidos:`n$($bad -join "`n")"
}
$size = [math]::Round((Get-Item $zip).Length / 1KB, 1)
Write-Host "OK: $zip ($size KB). Súbelo a HydroGreen-Entregas/base/"
