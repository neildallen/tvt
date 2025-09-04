import { supabase, handleSupabaseError } from '../lib/supabase';

export class ImageUploadService {
  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(file: File, bucket: string = 'token-logos'): Promise<string> {
    try {
      // First, try to upload directly (bucket should exist from setup)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        
        // If bucket doesn't exist, try to create it
        if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
          console.warn(`Bucket '${bucket}' does not exist. Attempting to create it...`);
          
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5242880 // 5MB
          });
          
          if (createError) {
            console.error('Could not create bucket:', createError);
            throw new Error('Storage bucket not available and could not be created');
          }
          
          // Retry upload after creating bucket
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });
            
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Uploaded image URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Return a placeholder URL as fallback instead of throwing
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      return `https://via.placeholder.com/150x150.png?text=${encodeURIComponent(fileName)}`;
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  static async deleteImage(url: string, bucket: string = 'token-logos'): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get last two parts: "logos/filename"

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for deletion failures as they're not critical
    }
  }

  /**
   * Get signed URL for private images (if needed)
   */
  static async getSignedUrl(path: string, bucket: string = 'token-logos', expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }
}
