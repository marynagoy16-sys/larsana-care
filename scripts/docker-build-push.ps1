# LarsanaCare — build e push da imagem Docker do frontend
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env'

if (-not (Test-Path $envFile)) {
    Write-Error "Arquivo .env não encontrado. Copie .env.example para .env e preencha as chaves."
}

function Get-EnvValue([string]$Name) {
    foreach ($line in Get-Content $envFile) {
        if ($line -match "^\s*$Name=(.*)$") {
            return $matches[1].Trim()
        }
    }
    return $null
}

$supabaseUrl = Get-EnvValue 'VITE_SUPABASE_URL'
$supabaseKey = Get-EnvValue 'VITE_SUPABASE_ANON_KEY'
$devLogin = Get-EnvValue 'VITE_ENABLE_DEV_LOGIN'
if (-not $devLogin) { $devLogin = 'true' }

$image = Get-EnvValue 'DOCKER_IMAGE'
if (-not $image) { $image = 'sagittadigital/larsana-care-frontend:latest' }

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Error 'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env'
}

Write-Host "Build: $image"
docker build `
    -f (Join-Path $root 'docker/Dockerfile.frontend') `
    -t $image `
    --build-arg "VITE_SUPABASE_URL=$supabaseUrl" `
    --build-arg "VITE_SUPABASE_ANON_KEY=$supabaseKey" `
    --build-arg "VITE_ENABLE_DEV_LOGIN=$devLogin" `
    $root

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Push: $image"
docker push $image

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push falhou. Faça login com: docker login"
    exit $LASTEXITCODE
}

Write-Host "Imagem publicada: $image"
