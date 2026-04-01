-- This ensures the bucket exists in the storage schema
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', true)
ON CONFLICT (id) DO NOTHING;