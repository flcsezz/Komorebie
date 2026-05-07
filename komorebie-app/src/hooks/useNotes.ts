import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  folder: string;
  is_favorite: boolean;
  tags: string[];
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async (note: Partial<Note>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...note, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => prev.map(n => n.id === id ? data : n));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote
  };
};
