import { Book } from './dataStructures';

export type GraphVisualizationEvent =
  | { type: 'add_node'; nodeId: string; nodeType: 'student' | 'book'; label: string }
  | { type: 'add_edge'; from: string; to: string; edgeType: 'wants' | 'owns' | 'swap' }
  | { type: 'bfs_start'; startNode: string }
  | { type: 'bfs_visit'; nodeId: string; level: number }
  | { type: 'bfs_explore'; from: string; to: string }
  | { type: 'match_found'; path: string[]; description: string }
  | { type: 'highlight_node'; nodeId: string; reason: string };

export interface GraphNode {
  id: string;
  type: 'student' | 'book';
  label: string;
  data?: any;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'wants' | 'owns' | 'swap';
}

type EventListener = (events: GraphVisualizationEvent[]) => void;

export class BookExchangeGraph {
  private nodes: Map<string, GraphNode>;
  private adjacencyList: Map<string, Set<string>>;
  private edges: GraphEdge[];
  private eventListeners: EventListener[] = [];
  private currentEvents: GraphVisualizationEvent[] = [];

  constructor() {
    this.nodes = new Map();
    this.adjacencyList = new Map();
    this.edges = [];
  }

  addListener(listener: EventListener) {
    this.eventListeners.push(listener);
  }

  private emit(event: GraphVisualizationEvent) {
    this.currentEvents.push(event);
  }

  private flushEvents() {
    if (this.currentEvents.length > 0) {
      this.eventListeners.forEach(listener => listener([...this.currentEvents]));
      this.currentEvents = [];
    }
  }

  addNode(id: string, type: 'student' | 'book', label: string, data?: any) {
    const node: GraphNode = { id, type, label, data };
    this.nodes.set(id, node);
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, new Set());
    }
    this.emit({ type: 'add_node', nodeId: id, nodeType: type, label });
    this.flushEvents();
  }

  addEdge(from: string, to: string, edgeType: 'wants' | 'owns' | 'swap') {
    if (!this.adjacencyList.has(from)) {
      this.adjacencyList.set(from, new Set());
    }
    this.adjacencyList.get(from)!.add(to);
    this.edges.push({ from, to, type: edgeType });
    this.emit({ type: 'add_edge', from, to, edgeType });
    this.flushEvents();
  }

  findMatches(studentId: string): string[][] {
    this.currentEvents = [];
    this.emit({ type: 'bfs_start', startNode: studentId });
    
    const matches: string[][] = [];
    const visited = new Set<string>();
    const queue: { node: string; path: string[]; level: number }[] = [
      { node: studentId, path: [studentId], level: 0 }
    ];

    visited.add(studentId);

    while (queue.length > 0) {
      const { node, path, level } = queue.shift()!;
      
      this.emit({ type: 'bfs_visit', nodeId: node, level });

      const neighbors = this.adjacencyList.get(node) || new Set();
      for (const neighbor of neighbors) {
        this.emit({ type: 'bfs_explore', from: node, to: neighbor });
        
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const newPath = [...path, neighbor];
          
          // Check if we found a match (cycle back to original student through books)
          if (neighbor === studentId && newPath.length > 2) {
            matches.push(newPath);
            this.emit({ 
              type: 'match_found', 
              path: newPath,
              description: `Found exchange path: ${newPath.join(' → ')}`
            });
          } else if (level < 4) { // Limit depth to avoid infinite loops
            queue.push({ node: neighbor, path: newPath, level: level + 1 });
          }
        }
      }
    }

    this.flushEvents();
    return matches;
  }

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): GraphEdge[] {
    return this.edges;
  }

  clear() {
    this.nodes.clear();
    this.adjacencyList.clear();
    this.edges = [];
    this.currentEvents = [];
  }

  // Build graph from current database state
  buildFromData(
    students: Array<{ id: string; name: string }>,
    books: Book[],
    requests: Array<{ student_id: string; book_id: string }>,
    swaps: Array<{ from_user_id: string; to_user_id: string; book_id: string }>
  ) {
    this.clear();

    // Add student nodes
    students.forEach(student => {
      this.addNode(student.id, 'student', student.name);
    });

    // Add book nodes
    books.forEach(book => {
      this.addNode(book.id, 'book', book.name, book);
    });

    // Add ownership edges (student owns book)
    books.forEach(book => {
      if (book.owner) {
        this.addEdge(book.owner, book.id, 'owns');
      }
    });

    // Add request edges (student wants book)
    requests.forEach(request => {
      this.addEdge(request.student_id, request.book_id, 'wants');
    });

    // Add swap edges (completed exchanges)
    swaps.forEach(swap => {
      this.addEdge(swap.from_user_id, swap.to_user_id, 'swap');
    });
  }
}

export const bookExchangeGraph = new BookExchangeGraph();
