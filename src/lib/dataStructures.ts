// Data Structures with Visualization Events

export interface Movie {
  id: string;
  name: string;
  rating: number;
  posterUrl?: string;
  year?: number;
}

export type VisualizationEvent = 
  | { type: 'hash-probe'; bucket: number; movieId: string }
  | { type: 'hash-chain-compare'; bucket: number; index: number; movieId: string; match: boolean }
  | { type: 'hash-insert'; bucket: number; movieId: string }
  | { type: 'hash-update'; bucket: number; movieId: string }
  | { type: 'hash-resize-start'; oldSize: number; newSize: number }
  | { type: 'hash-rehash'; movieId: string; oldBucket: number; newBucket: number }
  | { type: 'hash-resize-complete' }
  | { type: 'avl-visit'; nodeId: string; rating: number; purpose: string }
  | { type: 'avl-insert'; nodeId: string; rating: number }
  | { type: 'avl-delete'; nodeId: string; rating: number }
  | { type: 'avl-rotate'; rotationType: 'LL' | 'LR' | 'RR' | 'RL'; pivotId: string }
  | { type: 'avl-update-metrics'; nodeId: string; height: number; balance: number; size: number }
  | { type: 'avl-rank'; nodeId: string; rank: number };

export type EventListener = (event: VisualizationEvent) => void;

// Hash Table with Separate Chaining
export class HashTable {
  private buckets: Movie[][];
  private capacity: number;
  private size: number;
  private loadFactorThreshold = 0.75;
  private listeners: EventListener[] = [];

  constructor(initialCapacity = 8) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: initialCapacity }, () => []);
    this.size = 0;
  }

  private hash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % this.capacity;
  }

  addListener(listener: EventListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: EventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: VisualizationEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  private async resize() {
    const oldCapacity = this.capacity;
    const newCapacity = this.capacity * 2;
    const oldBuckets = this.buckets;

    this.emit({ type: 'hash-resize-start', oldSize: oldCapacity, newSize: newCapacity });

    this.capacity = newCapacity;
    this.buckets = Array.from({ length: newCapacity }, () => []);
    this.size = 0;

    // Rehash all items
    for (let i = 0; i < oldBuckets.length; i++) {
      for (const movie of oldBuckets[i]) {
        const newBucket = this.hash(movie.id);
        this.emit({ type: 'hash-rehash', movieId: movie.id, oldBucket: i, newBucket });
        this.buckets[newBucket].push(movie);
        this.size++;
      }
    }

    this.emit({ type: 'hash-resize-complete' });
  }

  async insert(movie: Movie): Promise<void> {
    const bucket = this.hash(movie.id);
    this.emit({ type: 'hash-probe', bucket, movieId: movie.id });

    const chain = this.buckets[bucket];
    
    // Check if exists
    for (let i = 0; i < chain.length; i++) {
      this.emit({ type: 'hash-chain-compare', bucket, index: i, movieId: movie.id, match: chain[i].id === movie.id });
      if (chain[i].id === movie.id) {
        chain[i] = movie; // Update
        this.emit({ type: 'hash-update', bucket, movieId: movie.id });
        return;
      }
    }

    // Insert new
    chain.push(movie);
    this.size++;
    this.emit({ type: 'hash-insert', bucket, movieId: movie.id });

    // Check load factor
    if (this.size / this.capacity > this.loadFactorThreshold) {
      await this.resize();
    }
  }

  async search(movieId: string): Promise<Movie | null> {
    const bucket = this.hash(movieId);
    this.emit({ type: 'hash-probe', bucket, movieId });

    const chain = this.buckets[bucket];
    
    for (let i = 0; i < chain.length; i++) {
      const match = chain[i].id === movieId;
      this.emit({ type: 'hash-chain-compare', bucket, index: i, movieId, match });
      if (match) {
        return chain[i];
      }
    }

    return null;
  }

  getBuckets(): Movie[][] {
    return this.buckets;
  }

  getMetrics() {
    return {
      size: this.size,
      capacity: this.capacity,
      loadFactor: this.size / this.capacity,
      buckets: this.buckets.length
    };
  }
}

// AVL Tree Node
class AVLNode {
  movie: Movie;
  left: AVLNode | null = null;
  right: AVLNode | null = null;
  height: number = 1;
  size: number = 1; // Subtree size

  constructor(movie: Movie) {
    this.movie = movie;
  }

  get balance(): number {
    return this.getHeight(this.left) - this.getHeight(this.right);
  }

  private getHeight(node: AVLNode | null): number {
    return node ? node.height : 0;
  }

  updateMetrics() {
    this.height = 1 + Math.max(this.getHeight(this.left), this.getHeight(this.right));
    this.size = 1 + (this.left?.size || 0) + (this.right?.size || 0);
  }
}

// AVL Tree ordered by (rating DESC, id ASC)
export class AVLTree {
  private root: AVLNode | null = null;
  private listeners: EventListener[] = [];

  addListener(listener: EventListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: EventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: VisualizationEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  // Compare: rating DESC, then id ASC
  private compare(a: Movie, b: Movie): number {
    if (a.rating !== b.rating) {
      return b.rating - a.rating; // Higher rating first
    }
    return a.id.localeCompare(b.id); // Alphabetical for ties
  }

  private rotateRight(y: AVLNode): AVLNode {
    this.emit({ type: 'avl-rotate', rotationType: 'LL', pivotId: y.movie.id });
    
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.updateMetrics();
    x.updateMetrics();

    this.emit({ type: 'avl-update-metrics', nodeId: y.movie.id, height: y.height, balance: y.balance, size: y.size });
    this.emit({ type: 'avl-update-metrics', nodeId: x.movie.id, height: x.height, balance: x.balance, size: x.size });

    return x;
  }

  private rotateLeft(x: AVLNode): AVLNode {
    this.emit({ type: 'avl-rotate', rotationType: 'RR', pivotId: x.movie.id });
    
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.updateMetrics();
    y.updateMetrics();

    this.emit({ type: 'avl-update-metrics', nodeId: x.movie.id, height: x.height, balance: x.balance, size: x.size });
    this.emit({ type: 'avl-update-metrics', nodeId: y.movie.id, height: y.height, balance: y.balance, size: y.size });

    return y;
  }

  async insert(movie: Movie): Promise<void> {
    this.root = await this.insertNode(this.root, movie);
  }

  private async insertNode(node: AVLNode | null, movie: Movie): Promise<AVLNode> {
    // Standard BST insertion
    if (!node) {
      this.emit({ type: 'avl-insert', nodeId: movie.id, rating: movie.rating });
      return new AVLNode(movie);
    }

    this.emit({ type: 'avl-visit', nodeId: node.movie.id, rating: node.movie.rating, purpose: 'insert' });

    const cmp = this.compare(movie, node.movie);
    
    if (cmp < 0) {
      node.left = await this.insertNode(node.left, movie);
    } else if (cmp > 0) {
      node.right = await this.insertNode(node.right, movie);
    } else {
      // Duplicate - update
      node.movie = movie;
      return node;
    }

    // Update metrics
    node.updateMetrics();
    this.emit({ type: 'avl-update-metrics', nodeId: node.movie.id, height: node.height, balance: node.balance, size: node.size });

    // Balance
    const balance = node.balance;

    // LL
    if (balance > 1 && node.left && this.compare(movie, node.left.movie) < 0) {
      return this.rotateRight(node);
    }

    // RR
    if (balance < -1 && node.right && this.compare(movie, node.right.movie) > 0) {
      return this.rotateLeft(node);
    }

    // LR
    if (balance > 1 && node.left && this.compare(movie, node.left.movie) > 0) {
      this.emit({ type: 'avl-rotate', rotationType: 'LR', pivotId: node.movie.id });
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }

    // RL
    if (balance < -1 && node.right && this.compare(movie, node.right.movie) < 0) {
      this.emit({ type: 'avl-rotate', rotationType: 'RL', pivotId: node.movie.id });
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }

    return node;
  }

  async delete(movieId: string): Promise<void> {
    this.root = await this.deleteNode(this.root, movieId);
  }

  private async deleteNode(node: AVLNode | null, movieId: string): Promise<AVLNode | null> {
    if (!node) return null;

    this.emit({ type: 'avl-visit', nodeId: node.movie.id, rating: node.movie.rating, purpose: 'delete' });

    if (movieId === node.movie.id) {
      this.emit({ type: 'avl-delete', nodeId: node.movie.id, rating: node.movie.rating });

      // Node with only one child or no child
      if (!node.left || !node.right) {
        return node.left || node.right;
      }

      // Node with two children: Get inorder successor
      const temp = this.minValueNode(node.right);
      node.movie = temp.movie;
      node.right = await this.deleteNode(node.right, temp.movie.id);
    } else if (movieId < node.movie.id) {
      node.left = await this.deleteNode(node.left, movieId);
    } else {
      node.right = await this.deleteNode(node.right, movieId);
    }

    node.updateMetrics();
    this.emit({ type: 'avl-update-metrics', nodeId: node.movie.id, height: node.height, balance: node.balance, size: node.size });

    // Balance
    const balance = node.balance;

    if (balance > 1 && node.left && node.left.balance >= 0) {
      return this.rotateRight(node);
    }

    if (balance > 1 && node.left && node.left.balance < 0) {
      this.emit({ type: 'avl-rotate', rotationType: 'LR', pivotId: node.movie.id });
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }

    if (balance < -1 && node.right && node.right.balance <= 0) {
      return this.rotateLeft(node);
    }

    if (balance < -1 && node.right && node.right.balance > 0) {
      this.emit({ type: 'avl-rotate', rotationType: 'RL', pivotId: node.movie.id });
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }

    return node;
  }

  private minValueNode(node: AVLNode): AVLNode {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  // Top-k: Reverse in-order traversal (Right -> Node -> Left)
  async topRated(k: number): Promise<Movie[]> {
    const result: Movie[] = [];
    let rank = 1;
    
    const traverse = (node: AVLNode | null) => {
      if (!node || result.length >= k) return;

      // Right first (highest ratings)
      traverse(node.right);

      if (result.length < k) {
        this.emit({ type: 'avl-visit', nodeId: node.movie.id, rating: node.movie.rating, purpose: 'top-k' });
        this.emit({ type: 'avl-rank', nodeId: node.movie.id, rank });
        result.push(node.movie);
        rank++;
      }

      // Then left
      traverse(node.left);
    };

    traverse(this.root);
    return result;
  }

  search(movieId: string): Movie | null {
    let current = this.root;
    while (current) {
      this.emit({ type: 'avl-visit', nodeId: current.movie.id, rating: current.movie.rating, purpose: 'search' });
      if (current.movie.id === movieId) {
        return current.movie;
      }
      current = movieId < current.movie.id ? current.left : current.right;
    }
    return null;
  }

  getRoot(): AVLNode | null {
    return this.root;
  }

  toArray(): Movie[] {
    const result: Movie[] = [];
    const traverse = (node: AVLNode | null) => {
      if (!node) return;
      traverse(node.right);
      result.push(node.movie);
      traverse(node.left);
    };
    traverse(this.root);
    return result;
  }
}
