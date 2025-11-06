export type QueueVisualizationEvent =
  | { type: 'enqueue'; item: any; position: number }
  | { type: 'dequeue'; item: any }
  | { type: 'peek'; item: any }
  | { type: 'empty_check'; isEmpty: boolean }
  | { type: 'size_check'; size: number }
  | { type: 'highlight_front'; reason: string }
  | { type: 'highlight_rear'; reason: string };

type EventListener = (events: QueueVisualizationEvent[]) => void;

export interface QueueItem {
  id: string;
  data: any;
  timestamp: number;
  priority?: number;
}

export class RequestQueue {
  private items: QueueItem[];
  private eventListeners: EventListener[] = [];
  private currentEvents: QueueVisualizationEvent[] = [];

  constructor() {
    this.items = [];
  }

  addListener(listener: EventListener) {
    this.eventListeners.push(listener);
  }

  private emit(event: QueueVisualizationEvent) {
    this.currentEvents.push(event);
  }

  private flushEvents() {
    if (this.currentEvents.length > 0) {
      this.eventListeners.forEach(listener => listener([...this.currentEvents]));
      this.currentEvents = [];
    }
  }

  enqueue(data: any, priority?: number) {
    this.currentEvents = [];
    
    const item: QueueItem = {
      id: crypto.randomUUID(),
      data,
      timestamp: Date.now(),
      priority: priority ?? 0
    };

    // If priority queue, insert in order
    if (priority !== undefined) {
      let insertIndex = this.items.findIndex(i => (i.priority ?? 0) < priority);
      if (insertIndex === -1) insertIndex = this.items.length;
      
      this.items.splice(insertIndex, 0, item);
      this.emit({ type: 'enqueue', item, position: insertIndex });
    } else {
      // Regular FIFO queue
      this.items.push(item);
      this.emit({ type: 'enqueue', item, position: this.items.length - 1 });
    }

    this.emit({ type: 'highlight_rear', reason: 'New item added to rear' });
    this.flushEvents();
    return item.id;
  }

  dequeue(): QueueItem | null {
    this.currentEvents = [];
    
    if (this.items.length === 0) {
      this.emit({ type: 'empty_check', isEmpty: true });
      this.flushEvents();
      return null;
    }

    const item = this.items.shift()!;
    this.emit({ type: 'dequeue', item });
    this.emit({ type: 'highlight_front', reason: 'Item removed from front' });
    this.flushEvents();
    return item;
  }

  peek(): QueueItem | null {
    this.currentEvents = [];
    
    if (this.items.length === 0) {
      this.emit({ type: 'empty_check', isEmpty: true });
      this.flushEvents();
      return null;
    }

    const item = this.items[0];
    this.emit({ type: 'peek', item });
    this.emit({ type: 'highlight_front', reason: 'Peeking at front item' });
    this.flushEvents();
    return item;
  }

  isEmpty(): boolean {
    const empty = this.items.length === 0;
    this.currentEvents = [];
    this.emit({ type: 'empty_check', isEmpty: empty });
    this.flushEvents();
    return empty;
  }

  size(): number {
    const sz = this.items.length;
    this.currentEvents = [];
    this.emit({ type: 'size_check', size: sz });
    this.flushEvents();
    return sz;
  }

  getItems(): QueueItem[] {
    return [...this.items];
  }

  clear() {
    this.items = [];
    this.currentEvents = [];
  }

  // Remove specific item by ID
  remove(itemId: string): boolean {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Priority queue implementation
export class PriorityRequestQueue extends RequestQueue {
  enqueue(data: any, priority: number = 0) {
    return super.enqueue(data, priority);
  }
}

export const requestQueue = new RequestQueue();
