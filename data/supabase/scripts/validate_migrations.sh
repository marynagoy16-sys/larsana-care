#!/usr/bin/env bash
# Validate migrations against PostgreSQL 15 (stub auth/storage schemas)
set -euo pipefail

CONTAINER="larsana-pg-validate"
PORT=54329
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIGRATIONS="$ROOT/supabase/migrations"

docker rm -f "$CONTAINER" 2>/dev/null || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres -p "$PORT:5432" postgres:15-alpine

echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  docker exec "$CONTAINER" pg_isready -U postgres && break
  sleep 1
done

docker exec -i "$CONTAINER" psql -U postgres -d postgres <<'STUB'
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
STUB

for f in $(ls "$MIGRATIONS"/*.sql | sort); do
  echo "Applying $(basename "$f")..."
  docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$f"
done

echo "Applying seed.sql..."
docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$ROOT/supabase/seed.sql"

echo "Counting tables..."
docker exec "$CONTAINER" psql -U postgres -d postgres -c \
  "SELECT count(*) AS public_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

docker rm -f "$CONTAINER"
echo "All migrations applied successfully."
