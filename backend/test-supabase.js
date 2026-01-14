
import { supabase } from './supabaseClient.js';
import fs from 'fs';

async function test() {
    const results = [];

    // 1. Test Storage
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) results.push(`ERR Storage Buckets: ${bucketError.message}`);
    else {
        results.push(`OK Storage Buckets: ${buckets.map(b => b.name).join(', ')}`);
        const hasMessages = buckets.some(b => b.name === 'messages');
        const hasAvatars = buckets.some(b => b.name === 'avatars');
        if (!hasMessages) {
            results.push("Attempting to create 'messages' bucket...");
            const { error: createError } = await supabase.storage.createBucket('messages', { public: true });
            if (createError) results.push(`❌ Failed to create 'messages' bucket: ${createError.message}`);
            else results.push("✅ Successfully created 'messages' bucket.");
        }
        if (!hasAvatars) {
            results.push("Attempting to create 'avatars' bucket...");
            const { error: createError } = await supabase.storage.createBucket('avatars', { public: true });
            if (createError) results.push(`❌ Failed to create 'avatars' bucket: ${createError.message}`);
            else results.push("✅ Successfully created 'avatars' bucket.");
        }
    }

    // 2. Test Database
    const { error: userError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (userError) results.push(`ERR 'users' table: ${userError.message}`);
    else results.push("OK 'users' table is accessible.");

    const { data: msgCols, error: msgError } = await supabase.from('messages').select('*').limit(1);
    if (msgError) results.push(`ERR 'messages' table: ${msgError.message}`);
    else {
        results.push("OK 'messages' table is accessible.");
        if (msgCols.length > 0) {
            const hasFileUrl = 'file_url' in msgCols[0];
            if (!hasFileUrl) results.push("ERR 'messages' table is missing 'file_url' column!");
            else results.push("OK 'messages' table has 'file_url' column.");
        }
    }

    console.log("\n--- TEST RESULTS ---");
    results.forEach(r => console.log(r));
    console.log("--------------------\n");

    fs.writeFileSync('results.txt', results.join('\n'));
}

test();
