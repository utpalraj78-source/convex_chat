import { supabase } from '../supabaseClient.js';

/**
 * Uploads a file buffer to Supabase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} bucket - Bucket name
 * @param {string} path - Path within the bucket
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadToSupabase(buffer, bucket, path, contentType) {
    try {
        // 1. Ensure bucket exists (optional, might fail if key is not service_role)
        // We'll just try to upload and catch error if bucket missing

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, buffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error(`[Supabase Storage] Upload error for ${path}:`, error);
            throw error;
        }

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (err) {
        console.error('[Supabase Storage] Helper error:', err);
        throw err;
    }
}
