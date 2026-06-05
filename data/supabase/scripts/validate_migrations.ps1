$ErrorActionPreference = "Stop"
$Container = "larsana-pg-validate"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Migrations = Join-Path $Root "supabase\migrations"

$stub = @'
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  instance_id uuid,
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  confirmation_token text DEFAULT '',
  email_change text DEFAULT '',
  email_change_token_new text DEFAULT '',
  recovery_token text DEFAULT ''
);

CREATE TABLE auth.identities (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  provider_id text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (provider, provider_id)
);

CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz,
  metadata jsonb,
  path_tokens text[],
  version text,
  owner_id text
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$ SELECT NULL::uuid; $$;

DO $$ BEGIN
  CREATE ROLE authenticated;
  CREATE ROLE anon;
  CREATE ROLE service_role;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$ SELECT string_to_array(name, '/'); $$;
'@

$stub | docker exec -i $Container psql -U postgres -d postgres -v ON_ERROR_STOP=1

Get-ChildItem $Migrations -Filter "*.sql" | Sort-Object Name | ForEach-Object {
  Write-Host "Applying $($_.Name)..."
  Get-Content $_.FullName -Raw | docker exec -i $Container psql -U postgres -d postgres -v ON_ERROR_STOP=1
}

Write-Host "Applying seed.sql..."
Get-Content (Join-Path $Root "supabase\seed.sql") -Raw | docker exec -i $Container psql -U postgres -d postgres -v ON_ERROR_STOP=1

docker exec $Container psql -U postgres -d postgres -c "SELECT count(*) AS public_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
Write-Host "All migrations applied successfully."
