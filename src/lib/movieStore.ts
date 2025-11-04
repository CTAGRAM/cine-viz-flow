import { Movie, HashTable, AVLTree, VisualizationEvent } from './dataStructures';
import { OperationMetadata } from './visualizationEngine';

export class MovieStore {
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

  async addMovie(movie: Movie) {
    // Check if updating (rating change requires AVL update)
    const existing = await this.hashTable.search(movie.id);
    const isRatingChange = existing && existing.rating !== movie.rating;

    this.currentOperation = {
      type: isRatingChange ? 'UPDATE' : 'ADD',
      movieId: movie.id,
      movieName: movie.name,
      timestamp: Date.now(),
      eventsCount: 0
    };

    if (isRatingChange) {
      // Delete old rating from AVL, then insert new
      await this.avlTree.delete(movie.id);
    }

    await this.hashTable.insert(movie);
    await this.avlTree.insert(movie);

    if (this.currentOperation) {
      this.currentOperation.eventsCount = this.eventQueue.length;
    }

    this.flushEvents();
    this.persist();
  }

  async searchMovie(id: string): Promise<Movie | null> {
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

  async topRated(k: number): Promise<Movie[]> {
    this.currentOperation = {
      type: 'TOP_K',
      timestamp: Date.now(),
      eventsCount: 0
    };

    const result = await this.avlTree.topRated(k);

    if (this.currentOperation) {
      this.currentOperation.eventsCount = this.eventQueue.length;
      this.currentOperation.movieName = `Top ${k} Movies`;
    }

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
