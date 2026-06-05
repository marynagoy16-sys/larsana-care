# LarsanaCare — setup ambiente de desenvolvimento
$root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$root\.env")) {
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "Criado .env a partir de .env.example — preencha as chaves Supabase."
}

if (-not (Test-Path "$root\frontend\node_modules")) {
    Push-Location "$root\frontend"
    npm install
    Pop-Location
}

Write-Host "Pronto. Execute: cd frontend && npm run dev"
