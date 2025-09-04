-- Quick fix for storage RLS policy violation
-- Run this in your Supabase SQL Editor to immediately resolve the issue

-- Create the token-logos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'token-logos',
  'token-logos', 
  true,
  5242880,  -- 5MB in bytes
  ARRAY['image/*']
) ON CONFLICT (id) DO NOTHING;

-- Note: RLS is already enabled on storage tables by Supabase
-- We just need to create the policies

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Public read access for token-logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload token logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update token logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete token logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow bucket listing" ON storage.buckets;
DROP POLICY IF EXISTS "Service can create buckets" ON storage.buckets;

-- Create storage policies for token-logos bucket

-- Allow public read access to token-logos bucket
CREATE POLICY "Public read access for token-logos" ON storage.objects
FOR SELECT USING (bucket_id = 'token-logos');

-- Allow anyone to upload to token-logos bucket (for anonymous token creation)
CREATE POLICY "Anyone can upload token logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'token-logos');

-- Allow anyone to update uploads in token-logos bucket
CREATE POLICY "Anyone can update token logos" ON storage.objects
FOR UPDATE WITH CHECK (bucket_id = 'token-logos');

-- Allow anyone to delete uploads in token-logos bucket
CREATE POLICY "Anyone can delete token logos" ON storage.objects
FOR DELETE USING (bucket_id = 'token-logos');

-- Allow bucket listing (needed for the service to check if bucket exists)
CREATE POLICY "Allow bucket listing" ON storage.buckets
FOR SELECT USING (true);

-- Allow bucket creation for service role
CREATE POLICY "Service can create buckets" ON storage.buckets
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR name = 'token-logos');
