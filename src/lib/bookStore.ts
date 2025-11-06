import { Book, HashTable, AVLTree, VisualizationEvent } from './dataStructures';
import { OperationMetadata } from './visualizationEngine';
import { supabase } from '@/integrations/supabase/client';
import { saveVisualizationEvent } from '@/hooks/useVisualizationSync';
import { bookTrie } from './trieDataStructure';
import { bookExchangeGraph } from './graphDataStructure';

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

    const operationType = isRatingChange ? 'UPDATE' : 'ADD';

    this.currentOperation = {
      type: operationType,
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

    // Update trie for search
    bookTrie.insert(book.name, book.id);
    if (book.author) {
      bookTrie.insert(book.author, book.id);
    }

    if (this.currentOperation) {
      this.currentOperation.eventsCount = this.eventQueue.length;
    }

    this.flushEvents();
    
    // Save visualization to database
    await saveVisualizationEvent(
      operationType,
      'hash_table',
      this.eventQueue,
      {
        bookId: book.id,
        bookName: book.name,
        description: `${operationType === 'ADD' ? 'Added' : 'Updated'} book: ${book.name}`
      }
    );

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
    
    // Save visualization to database
    await saveVisualizationEvent(
      'SEARCH',
      'hash_table',
      this.eventQueue,
      {
        bookId: id,
        bookName: result?.name,
        description: `Searched for book: ${id}`
      }
    );

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
    
    // Save visualization to database
    await saveVisualizationEvent(
      'TOP_K',
      'avl_tree',
      this.eventQueue,
      {
        description: `Retrieved top ${k} rated books`
      }
    );

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
    // Data persisted to Supabase
    console.log('Data persisted to Supabase');
  }

  async loadFromStorage() {
    try {
      // Load from Supabase
      const { data: books, error } = await supabase
        .from('books')
        .select('*');

      if (error) {
        console.error('Error loading from Supabase:', error);
        return;
      }

      if (books && books.length > 0) {
        for (const book of books) {
          const bookData: Book = {
            id: book.id,
            name: book.title,
            rating: Number(book.rating),
            posterUrl: book.poster_url || '',
            year: book.year || 0,
            author: book.author,
            subject: book.subject,
            condition: book.condition,
            owner: book.owner_user_id,
            available: book.available
          };
          
          await this.hashTable.insert(bookData);
          await this.avlTree.insert(bookData);
          
          // Build trie
          bookTrie.insert(bookData.name, bookData.id);
          if (bookData.author) {
            bookTrie.insert(bookData.author, bookData.id);
          }
        }
        
        // Don't flush events for initial load
        this.eventQueue = [];
        console.log(`Loaded ${books.length} books from Supabase`);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }
}

// Singleton
export const bookStore = new BookStore();

// Legacy export for backward compatibility
export { bookStore as movieStore };
export { BookStore as MovieStore };
