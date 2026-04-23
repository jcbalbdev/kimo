-- Tabla para guardar los tokens FCM de los dispositivos Android
-- Un usuario puede tener múltiples dispositivos (token único por dispositivo)

CREATE TABLE IF NOT EXISTS device_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token       text        NOT NULL UNIQUE,
  platform    text        NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Índice para buscar tokens por usuario rápidamente
CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);

-- Row Level Security
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y gestionar sus propios tokens
CREATE POLICY "Users manage their own device tokens"
  ON device_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
