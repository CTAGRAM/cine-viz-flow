import { Book, HashTable, AVLTree, VisualizationEvent } from './dataStructures';
import { OperationMetadata } from './visualizationEngine';

export class BookStore {
  private hashTable: HashTable;
  private avlTree: AVLTree;
  private eventQueue: VisualizationEvent[] = [];
  private eventListeners: ((events: VisualizationEvent[], operation?: OperationMetadata) => void)[] = [];
  private currentOperation?: OperationMetadata;

  constructor() {
    this.hashTable = new HashTable();
    this.avlTree = new AVLTree();

    // Collect events
    const eventCollector = (event: VisualizationEvent) => {
      this.eventQueue.push(event);
    };

    this.hashTable.addListener(eventCollector);
    this.avlTree.addListener(eventCollector);
  }

  private flushEvents() {
    if (this.eventQueue.length > 0) {
      const events = [...this.eventQueue];
      const operation = this.currentOperation;
      this.eventQueue = [];
      this.currentOperation = undefined;
      this.eventListeners.forEach(listener => listener(events, operation));
    }
  }

  onEvents(listener: (events: VisualizationEvent[], operation?: OperationMetadata) => void) {
    this.eventListeners.push(listener);
  }

  async addBook(book: Book) {
    // Check if updating (rating change requires AVL update)
    const existing = await this.hashTable.search(book.id);
    const isRatingChange = existing && existing.rating !== book.rating;

    this.currentOperation = {
      type: isRatingChange ? 'UPDATE' : 'ADD',
      movieId: book.id,
      movieName: book.name,
      timestamp: Date.now(),
      eventsCount: 0
    };

    if (isRatingChange) {
      // Delete old rating from AVL, then insert new
      await this.avlTree.delete(book.id);
    }

    await this.hashTable.insert(book);
    await this.avlTree.insert(book);

    if (this.currentOperation) {
      this.currentOperation.eventsCount = this.eventQueue.length;
    }

    this.flushEvents();
    this.persist();
  }

  async searchBook(id: string): Promise<Book | null> {
    this.currentOperation = {
      type: 'SEARCH',
      movieId: id,
      timestamp: Date.now(),
      eventsCount: 0
    };

    const result = await this.hashTable.search(id);

    if (this.currentOperation) {
      this.currentOperation.eventsCount = this.eventQueue.length;
      this.currentOperation.movieName = result?.name;
    }

    this.flushEvents();
    return result;
  }

  async topRated(k: number): Promise<Book[]> {
    this.currentOperation = {
      type: 'TOP_K',
      timestamp: Date.now(),
      eventsCount: 0
    };

    const result = await this.avlTree.topRated(k);

    if (this.currentOperation) {
      this.currentOperation.eventsCount = this.eventQueue.length;
      this.currentOperation.movieName = `Top ${k} Books`;
    }

    this.flushEvents();
    return result;
  }

  getAllBooks(): Book[] {
    return this.avlTree.toArray();
  }

  getHashTable(): HashTable {
    return this.hashTable;
  }

  getAVLTree(): AVLTree {
    return this.avlTree;
  }

  clearAll() {
    // Clear both data structures
    this.hashTable = new HashTable();
    this.avlTree = new AVLTree();
    
    // Re-attach listeners
    const eventCollector = (event: VisualizationEvent) => {
      this.eventQueue.push(event);
    };
    this.hashTable.addListener(eventCollector);
    this.avlTree.addListener(eventCollector);
    
    // Clear storage
    localStorage.removeItem('books');
    localStorage.removeItem('bookDataVersion');
  }

  private persist() {
    const books = this.getAllBooks();
    localStorage.setItem('books', JSON.stringify(books));
  }

  async loadFromStorage() {
    const stored = localStorage.getItem('books');
    if (stored) {
      const books: Book[] = JSON.parse(stored);
      for (const book of books) {
        await this.hashTable.insert(book);
        await this.avlTree.insert(book);
      }
      // Don't flush events for initial load
      this.eventQueue = [];
    }
  }
}

// Singleton
export const bookStore = new BookStore();

// Legacy export for backward compatibility
export { bookStore as movieStore };
export { BookStore as MovieStore };
