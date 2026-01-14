
import { supabase } from '../supabaseClient.js';

export default {
  async findOne(query) {
    let builder = supabase.from('users').select('*');

    // Iterate over all keys in the query object
    for (const key of Object.keys(query)) {
      builder = builder.eq(key, query[key]);
    }

    const { data, error } = await builder.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('User.findOne error:', error);
    }

    if (!data) return null;

    // Map to match Mongoose-like object structure for compatibility
    return {
      ...data,
      _id: data.id, // Alias id to _id for frontend compatibility
      save: async function () {
        // This is a partial mock of save() to handle updates
        // In a real refactor, we should call update() explicitly in the controller
        const { id, _id, save, ...updates } = this;
        await supabase.from('users').update(updates).eq('id', id);
      }
    };
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) console.error('User.findById error:', error);
    if (!data) return null;

    return {
      ...data,
      _id: data.id,
      save: async function () {
        const { id, _id, save, ...updates } = this;
        await supabase.from('users').update(updates).eq('id', id);
      }
    };
  },

  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return { ...data, _id: data.id };
  },

  async find(query = {}) {
    let builder = supabase.from('users').select('*');

    // Handle basic exclusion query like { _id: { $ne: payload.id } }
    if (query._id && query._id.$ne) {
      builder = builder.neq('id', query._id.$ne);
    }

    const { data, error } = await builder;
    if (error) throw error;

    return data.map(u => ({ ...u, _id: u.id }));
  }
};
