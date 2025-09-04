# Supabase Storage Setup for TvT Token Launchpad

This guide will help you set up Supabase Storage to handle token logo uploads and resolve the RLS policy violation error.

## 🔒 The Issue

The error `StorageApiError: new row violates row-level security policy` occurs because:

1. The `token-logos` storage bucket doesn't exist
2. Row-Level Security (RLS) policies for storage are not properly configured
3. The anonymous user doesn't have permission to create buckets

## 🛠 Solution

### Step 1: Create Storage Bucket Manually

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create a bucket with these settings:
   - **Name**: `token-logos`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/*`

### Step 2: Set Up Storage RLS Policies

Run this SQL in your Supabase SQL Editor to set up proper storage permissions:

```sql
-- Create the token-logos bucket first
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

-- Allow public read access to token-logos bucket
CREATE POLICY "Public read access for token-logos" ON storage.objects
FOR SELECT USING (bucket_id = 'token-logos');

-- Allow anyone to upload to token-logos bucket (for anonymous users)
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
```

### Step 3: Alternative - Manual Bucket Creation with SQL

If you prefer to create the bucket via SQL, run this instead of Step 1:

```sql
-- Create the token-logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'token-logos',
  'token-logos', 
  true,
  5242880,  -- 5MB in bytes
  ARRAY['image/*']
);
```

### Step 4: Test the Setup

After setting up the bucket and policies, test the image upload functionality:

1. Try creating a new token with a logo
2. The upload should now work without RLS errors
3. Check the Storage tab in Supabase to see uploaded files

## 🔧 Development Mode Fallback

The `ImageUploadService` already includes a fallback mechanism that returns placeholder images when uploads fail. This ensures the app continues to work even if storage is not set up correctly.

## 🚀 Production Considerations

### Security Enhancements

For production, consider these additional security measures:

```sql
-- More restrictive upload policy (optional)
CREATE POLICY "Restrict file types and sizes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'token-logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'logos'  -- Ensure files go in logos folder
  AND octet_length(decode(encode(storage.file_content, 'base64'), 'base64')) <= 5242880  -- 5MB limit
);

-- Prevent unauthorized bucket creation
CREATE POLICY "Prevent bucket creation" ON storage.buckets
FOR INSERT WITH CHECK (false);

-- Only allow reading of public buckets
CREATE POLICY "Only allow reading public buckets" ON storage.buckets
FOR SELECT USING (public = true);
```

### File Cleanup

Consider implementing a cleanup job for unused token logos:

```sql
-- Function to clean up orphaned images (run periodically)
CREATE OR REPLACE FUNCTION cleanup_orphaned_logos()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'token-logos' 
  AND name NOT IN (
    SELECT DISTINCT split_part(logo_url, '/', -1) 
    FROM tokens 
    WHERE logo_url IS NOT NULL 
    AND logo_url LIKE '%supabase%'
  );
END;
$$ LANGUAGE plpgsql;
```

## 📝 Verification Checklist

After setup, verify:

- [ ] `token-logos` bucket exists and is public
- [ ] RLS policies are created for storage.objects
- [ ] Image upload works in the app
- [ ] Uploaded images are publicly accessible
- [ ] No more RLS violation errors

## 🔗 Useful Links

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)

## 🆘 Troubleshooting

### Common Issues

1. **"Bucket not found" error**: Ensure the bucket name matches exactly (`token-logos`)
2. **"Permission denied" error**: Check RLS policies are created and applied correctly
3. **"File too large" error**: Verify file size limit (5MB default)
4. **"Invalid MIME type" error**: Ensure only image files are being uploaded
5. **"must be owner of table objects" error**: This occurs when trying to enable RLS on storage tables. RLS is already enabled by Supabase - just create the policies without the ALTER TABLE commands.

### Debug Commands

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'token-logos';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check recent uploads
SELECT * FROM storage.objects WHERE bucket_id = 'token-logos' ORDER BY created_at DESC LIMIT 10;
```