import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { visualizationEngine, OperationMetadata } from '@/lib/visualizationEngine';
import { VisualizationEvent } from '@/lib/dataStructures';

export const useVisualizationSync = () => {
  useEffect(() => {
    // Subscribe to real-time visualization events
    const channel = supabase
      .channel('visualization-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visualization_events'
        },
        async (payload) => {
          console.log('New visualization event received:', payload);
          
          const newEvent = payload.new as {
            id: string;
            user_id: string;
            operation_type: string;
            data_structure: string;
            events: any[];
            metadata: any;
            created_at: string;
          };

          // Convert to visualization events
          const events = newEvent.events as VisualizationEvent[];
          
          const operation: OperationMetadata = {
            type: newEvent.operation_type as any,
            movieName: newEvent.metadata?.bookName,
            movieId: newEvent.metadata?.bookId,
            timestamp: new Date(newEvent.created_at).getTime(),
            eventsCount: events.length
          };

          // Update visualization engine
          visualizationEngine.setEvents(events, operation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};

// Helper function to save visualization events to database
export const saveVisualizationEvent = async (
  operationType: 'ADD' | 'SEARCH' | 'UPDATE' | 'DELETE' | 'TOP_K' | 'MATCH',
  dataStructure: 'hash_table' | 'avl_tree' | 'trie' | 'graph' | 'queue',
  events: VisualizationEvent[],
  metadata?: {
    bookId?: string;
    bookName?: string;
    description?: string;
    [key: string]: any;
  }
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user logged in, skipping visualization save');
      return;
    }

    const { error } = await supabase
      .from('visualization_events')
      .insert({
        user_id: user.id,
        operation_type: operationType,
        data_structure: dataStructure,
        events: events as any,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Error saving visualization event:', error);
    } else {
      console.log('Visualization event saved successfully');
    }
  } catch (error) {
    console.error('Error in saveVisualizationEvent:', error);
  }
};
