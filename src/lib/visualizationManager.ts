import { VisualizationEvent } from './dataStructures';
import { saveVisualizationEvent } from '@/hooks/useVisualizationSync';

/**
 * Centralized visualization event management
 * Prevents event timing bugs and provides safe event handling
 */
export class VisualizationManager {
  /**
   * Safely captures events before they are cleared
   * Returns a copy to prevent mutation issues
   */
  static captureEvents(events: VisualizationEvent[]): VisualizationEvent[] {
    return [...events];
  }

  /**
   * Validates and saves visualization events
   * Only saves if events exist and user is authenticated
   */
  static async saveEvents(
    operationType: 'ADD' | 'SEARCH' | 'UPDATE' | 'DELETE' | 'TOP_K' | 'MATCH',
    dataStructure: 'hash_table' | 'avl_tree' | 'trie' | 'graph' | 'queue',
    events: VisualizationEvent[],
    metadata?: Record<string, any>
  ): Promise<boolean> {
    // Validate events exist
    if (!events || events.length === 0) {
      console.log(`No events to save for ${operationType} on ${dataStructure}`);
      return false;
    }

    try {
      await saveVisualizationEvent(operationType, dataStructure, events, metadata);
      console.log(`✅ Saved ${events.length} ${dataStructure} events for ${operationType}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save ${dataStructure} events:`, error);
      return false;
    }
  }

  /**
   * Batch save multiple visualization events
   */
  static async saveMultiple(
    saves: Array<{
      operationType: 'ADD' | 'SEARCH' | 'UPDATE' | 'DELETE' | 'TOP_K' | 'MATCH';
      dataStructure: 'hash_table' | 'avl_tree' | 'trie' | 'graph' | 'queue';
      events: VisualizationEvent[];
      metadata?: Record<string, any>;
    }>
  ): Promise<boolean[]> {
    return Promise.all(
      saves.map(save =>
        this.saveEvents(save.operationType, save.dataStructure, save.events, save.metadata)
      )
    );
  }
}
