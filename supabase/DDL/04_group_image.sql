-- Foto del gruppo: immagine ridimensionata (256px, JPEG) salvata come data URL.
-- Eseguire nell'SQL Editor di Supabase (schema master).
alter table master.groups add column if not exists image_url text;
