import { Book } from './dataStructures';

export type TrieVisualizationEvent =
  | { type: 'insert_start'; word: string }
  | { type: 'create_node'; char: string; path: string }
  | { type: 'traverse_node'; char: string; path: string }
  | { type: 'mark_end'; path: string; bookId: string }
  | { type: 'search_start'; prefix: string }
  | { type: 'search_step'; char: string; path: string; found: boolean }
  | { type: 'search_complete'; matches: string[] }
  | { type: 'highlight_path'; path: string; reason: string };

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  bookIds: string[]; // Store book IDs that match this word
}

type EventListener = (events: TrieVisualizationEvent[]) => void;

export class BookTrie {
  private root: TrieNode;
  private eventListeners: EventListener[] = [];
  private currentEvents: TrieVisualizationEvent[] = [];

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return {
      children: new Map(),
      isEndOfWord: false,
      bookIds: []
    };
  }

  addListener(listener: EventListener) {
    this.eventListeners.push(listener);
  }

  removeListener(listener: EventListener) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  clearListeners() {
    this.eventListeners = [];
  }

  private emit(event: TrieVisualizationEvent) {
    this.currentEvents.push(event);
  }

  private flushEvents() {
    if (this.currentEvents.length > 0) {
      this.eventListeners.forEach(listener => listener([...this.currentEvents]));
      this.currentEvents = [];
    }
  }

  insert(word: string, bookId: string) {
    if (!word) return;
    
    this.currentEvents = [];
    const normalizedWord = word.toLowerCase().trim();
    this.emit({ type: 'insert_start', word: normalizedWord });

    let current = this.root;
    let path = '';

    for (let i = 0; i < normalizedWord.length; i++) {
      const char = normalizedWord[i];
      path += char;

      if (!current.children.has(char)) {
        current.children.set(char, this.createNode());
        this.emit({ type: 'create_node', char, path });
      } else {
        this.emit({ type: 'traverse_node', char, path });
      }

      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    if (!current.bookIds.includes(bookId)) {
      current.bookIds.push(bookId);
    }
    this.emit({ type: 'mark_end', path, bookId });
    this.flushEvents();
  }

  search(prefix: string): string[] {
    this.currentEvents = [];
    const normalizedPrefix = prefix.toLowerCase().trim();
    
    if (!normalizedPrefix) {
      this.flushEvents();
      return [];
    }

    this.emit({ type: 'search_start', prefix: normalizedPrefix });

    let current = this.root;
    let path = '';

    // Navigate to the prefix node
    for (const char of normalizedPrefix) {
      path += char;
      
      if (!current.children.has(char)) {
        this.emit({ type: 'search_step', char, path, found: false });
        this.emit({ type: 'search_complete', matches: [] });
        this.flushEvents();
        return [];
      }

      this.emit({ type: 'search_step', char, path, found: true });
      current = current.children.get(char)!;
    }

    // Collect all words with this prefix
    const matches: string[] = [];
    this.collectAllWords(current, normalizedPrefix, matches);
    
    this.emit({ type: 'search_complete', matches });
    this.flushEvents();
    return matches;
  }

  private collectAllWords(node: TrieNode, prefix: string, result: string[]) {
    if (node.isEndOfWord) {
      result.push(prefix);
    }

    for (const [char, childNode] of node.children) {
      this.collectAllWords(childNode, prefix + char, result);
    }
  }

  // Get all book IDs matching a prefix
  searchBookIds(prefix: string): string[] {
    const normalizedPrefix = prefix.toLowerCase().trim();
    if (!normalizedPrefix) return [];

    let current = this.root;
    for (const char of normalizedPrefix) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    const bookIds: string[] = [];
    this.collectAllBookIds(current, bookIds);
    return bookIds;
  }

  private collectAllBookIds(node: TrieNode, result: string[]) {
    if (node.isEndOfWord) {
      result.push(...node.bookIds);
    }

    for (const childNode of node.children.values()) {
      this.collectAllBookIds(childNode, result);
    }
  }

  clear() {
    this.root = this.createNode();
    this.currentEvents = [];
  }

  // Build trie from books
  buildFromBooks(books: Book[]) {
    this.clear();
    
    books.forEach(book => {
      // Insert book title
      if (book.name) {
        this.insert(book.name, book.id);
        
        // Also insert individual words for better search
        book.name.split(/\s+/).forEach(word => {
          if (word.length > 2) { // Skip very short words
            this.insert(word, book.id);
          }
        });
      }

      // Insert author name
      if (book.author) {
        this.insert(book.author, book.id);
        
        book.author.split(/\s+/).forEach(word => {
          if (word.length > 2) {
            this.insert(word, book.id);
          }
        });
      }
    });
  }

  // Get trie structure for visualization
  getTrieStructure(): any {
    return this.nodeToObject(this.root, '');
  }

  private nodeToObject(node: TrieNode, path: string): any {
    return {
      path,
      isEndOfWord: node.isEndOfWord,
      bookIds: node.bookIds,
      children: Array.from(node.children.entries()).map(([char, childNode]) => ({
        char,
        ...this.nodeToObject(childNode, path + char)
      }))
    };
  }
}

export const bookTrie = new BookTrie();
