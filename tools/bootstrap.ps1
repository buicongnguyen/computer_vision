param(
    [switch]$WithVision
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Venv = Join-Path $Root ".venv"
$Python = Join-Path $Venv "Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    python -m venv $Venv
}

& $Python -m pip install --upgrade pip
& $Python -m pip install -e "${Root}[dev]"
if ($WithVision) {
    & $Python -m pip install -e "${Root}[vision]"
}

& $Python (Join-Path $PSScriptRoot "check_env.py")
& $Python -m pytest -q $Root
& $Python -m ruff check $Root
& $Python (Join-Path $PSScriptRoot "validate_materials.py")
& $Python (Join-Path $PSScriptRoot "validate_site.py")

Write-Host "`nReady. Activate with: $Venv\Scripts\Activate.ps1"
