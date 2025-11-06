import { useEffect, useState } from 'react';
import { bookStore } from '@/lib/bookStore';
import { supabase } from '@/integrations/supabase/client';

export const useDataInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load books from Supabase into data structures
        await bookStore.loadFromStorage();
        
        setIsInitialized(true);
        console.log('Data structures initialized with Supabase data');
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    // Subscribe to real-time updates for books
    const channel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books'
        },
        async (payload) => {
          console.log('Book change detected:', payload);
          // Reload data when books change
          await bookStore.loadFromStorage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isInitialized, isLoading };
};
