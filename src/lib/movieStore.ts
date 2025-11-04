import { Movie, HashTable, AVLTree, VisualizationEvent } from './dataStructures';

export class MovieStore {
  private hashTable: HashTable;
  private avlTree: AVLTree;
  private eventQueue: VisualizationEvent[] = [];
  private eventListeners: ((events: VisualizationEvent[]) => void)[] = [];

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
      this.eventQueue = [];
      this.eventListeners.forEach(listener => listener(events));
    }
  }

  onEvents(listener: (events: VisualizationEvent[]) => void) {
    this.eventListeners.push(listener);
  }

  async addMovie(movie: Movie) {
    // Check if updating (rating change requires AVL update)
    const existing = await this.hashTable.search(movie.id);
    const isRatingChange = existing && existing.rating !== movie.rating;

    if (isRatingChange) {
      // Delete old rating from AVL, then insert new
      await this.avlTree.delete(movie.id);
    }

    await this.hashTable.insert(movie);
    await this.avlTree.insert(movie);

    this.flushEvents();
    this.persist();
  }

  async searchMovie(id: string): Promise<Movie | null> {
    const result = await this.hashTable.search(id);
    this.flushEvents();
    return result;
  }

  async topRated(k: number): Promise<Movie[]> {
    const result = await this.avlTree.topRated(k);
    this.flushEvents();
    return result;
  }

  getAllMovies(): Movie[] {
    return this.avlTree.toArray();
  }

  getHashTable(): HashTable {
    return this.hashTable;
  }

  getAVLTree(): AVLTree {
    return this.avlTree;
  }

  private persist() {
    const movies = this.getAllMovies();
    localStorage.setItem('movies', JSON.stringify(movies));
  }

  async loadFromStorage() {
    const stored = localStorage.getItem('movies');
    if (stored) {
      const movies: Movie[] = JSON.parse(stored);
      for (const movie of movies) {
        await this.hashTable.insert(movie);
        await this.avlTree.insert(movie);
      }
      // Don't flush events for initial load
      this.eventQueue = [];
    }
  }
}

// Singleton
export const movieStore = new MovieStore();
