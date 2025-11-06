import { useEffect, useState } from 'react';
import { bookStore } from '@/lib/bookStore';
import { bookExchangeGraph } from '@/lib/graphDataStructure';
import { supabase } from '@/integrations/supabase/client';

export const useDataInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load books from Supabase into data structures
        await bookStore.loadFromStorage();
        
        // Build graph from Supabase data
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name');
        
        const { data: books } = await supabase
          .from('books')
          .select('*');
        
        const { data: requests } = await supabase
          .from('book_requests')
          .select('book_id, requester_user_id');
        
        const { data: swaps } = await supabase
          .from('swaps')
          .select('from_user_id, to_user_id, book_id');
        
        if (profiles && books) {
          const formattedBooks = books.map(b => ({
            id: b.id,
            name: b.title,
            rating: b.rating,
            author: b.author,
            subject: b.subject,
            condition: b.condition,
            year: b.year,
            posterUrl: b.poster_url,
            owner: b.owner_user_id,
            available: b.available,
          }));
          
          const formattedRequests = (requests || []).map(r => ({
            student_id: r.requester_user_id,
            book_id: r.book_id,
          }));
          
          bookExchangeGraph.buildFromData(
            profiles.map(p => ({ id: p.id, name: p.full_name })),
            formattedBooks,
            formattedRequests,
            swaps || []
          );
        }
        
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
