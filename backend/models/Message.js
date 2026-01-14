
import { supabase } from '../supabaseClient.js';

export default {
  async create(data) {
    // Map camelCase to snake_case for Supabase
    const payload = {
      from: data.from,
      to: data.to,
      type: data.type || 'text',
      text: data.text || null,
      file_url: data.fileUrl || null,
      file_name: data.fileName || null,
      file_size: data.fileSize || null,
      is_encrypted: data.isEncrypted || false,
      is_private: data.isPrivate || false,
      created_at: data.created_at || new Date()
    };

    // Ensure UUIDs are strings
    if (payload.from && typeof payload.from === 'object') payload.from = payload.from.toString();

    const { data: msg, error } = await supabase
      .from('messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase Message.create error:', error);
      console.error('Payload was:', payload);
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    return {
      ...msg,
      _id: msg.id,
      createdAt: msg.created_at,
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      fileSize: msg.file_size
    };
  },

  async find(query) {
    // Basic find support
    let builder = supabase.from('messages').select('*');
    Object.keys(query).forEach(key => {
      builder = builder.eq(key, query[key]);
    });

    const { data, error } = await builder;
    if (error) throw error;
    return data.map(m => ({
      ...m,
      _id: m.id,
      createdAt: m.created_at,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileSize: m.file_size
    }));
  },

  // Specialized method for fetching private chat history
  async getPrivateHistory(userId, peerId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from.eq.${userId},to.eq.${peerId}),and(from.eq.${peerId},to.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(m => ({
      ...m,
      _id: m.id,
      createdAt: m.created_at,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileSize: m.file_size
    }));
  },

  async getGroupHistory(groupId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('to', `group:${groupId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(m => ({
      ...m,
      _id: m.id,
      createdAt: m.created_at,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileSize: m.file_size
    }));
  }
};
