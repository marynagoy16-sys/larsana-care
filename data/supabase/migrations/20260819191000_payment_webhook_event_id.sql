-- Idempotency for Asaas at-least-once delivery.
-- Official events include an id (evt_...). Replays must not double-process.

ALTER TABLE public.payment_webhook_events
  ADD COLUMN IF NOT EXISTS asaas_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhook_events_asaas_event_id
  ON public.payment_webhook_events (asaas_event_id)
  WHERE asaas_event_id IS NOT NULL;

COMMENT ON COLUMN public.payment_webhook_events.asaas_event_id IS
  'Identificador do evento Asaas (evt_...). Chave de idempotência; payload completo não deve ser persistido.';
