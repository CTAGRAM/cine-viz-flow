/**
 * Sample visualization generators for demo mode
 * Creates realistic event sequences for each data structure
 */

export async function generateHashTableDemo(): Promise<any[]> {
  const events: any[] = [];
  const sampleBooks = [
    { id: 'DEMO-001', name: 'Clean Code', rating: 9.2 },
    { id: 'DEMO-002', name: 'Design Patterns', rating: 8.8 },
    { id: 'DEMO-003', name: 'The Pragmatic Programmer', rating: 9.0 },
    { id: 'DEMO-004', name: 'Refactoring', rating: 8.5 },
    { id: 'DEMO-005', name: 'Code Complete', rating: 8.9 }
  ];

  for (const book of sampleBooks) {
    const hash = Math.abs(book.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 10;
    
    events.push(
      { type: 'hash-probe', bucket: hash, movieId: book.id },
      { type: 'hash-insert', bucket: hash, movieId: book.id }
    );
    
    await delay(100);
  }

  return events;
}

export async function generateAVLTreeDemo(): Promise<any[]> {
  const events: any[] = [];
  const sampleRatings = [8.5, 9.2, 7.8, 9.5, 8.0, 9.8, 7.5];
  
  for (let i = 0; i < sampleRatings.length; i++) {
    const bookId = `DEMO-AVL-${i + 1}`;
    const rating = sampleRatings[i];
    
    events.push(
      { type: 'avl-visit', nodeId: 'root', rating, purpose: 'insert' },
      { type: 'avl-insert', nodeId: `node-${i}`, rating }
    );
    
    // Simulate rotation if needed
    if (i === 2 || i === 4) {
      events.push(
        { type: 'avl-update-metrics', nodeId: `node-${i - 1}`, height: 2, balance: -2, size: i + 1 },
        { type: 'avl-rotate', rotationType: 'LL', pivotId: `node-${i - 1}` }
      );
    }
    
    await delay(150);
  }

  return events;
}

export async function generateTrieDemo(): Promise<any[]> {
  const events: any[] = [];
  const sampleWords = ['code', 'clean', 'computer', 'programming', 'python'];
  
  // Insert phase
  for (const word of sampleWords) {
    events.push({ type: 'insert_start', word });
    
    let path = '';
    for (const char of word) {
      path += char;
      events.push(
        { type: 'create_node', char, path }
      );
      await delay(50);
    }
    
    events.push({ type: 'mark_end', path, bookId: `DEMO-${word}` });
  }
  
  // Search phase for prefix "pro"
  events.push({ type: 'search_start', prefix: 'pro' });
  let searchPath = '';
  for (const char of 'pro') {
    searchPath += char;
    events.push({ type: 'search_step', char, path: searchPath, found: true });
    await delay(100);
  }
  events.push({ type: 'search_complete', matches: ['programming'] });

  return events;
}

export async function generateGraphDemo(): Promise<any[]> {
  const events: any[] = [];
  
  // Create student nodes
  events.push(
    { type: 'add_node', nodeId: 'student-1', nodeType: 'student', label: 'Alice' },
    { type: 'add_node', nodeId: 'student-2', nodeType: 'student', label: 'Bob' },
    { type: 'add_node', nodeId: 'student-3', nodeType: 'student', label: 'Carol' }
  );
  
  await delay(200);
  
  // Create book nodes
  events.push(
    { type: 'add_node', nodeId: 'book-1', nodeType: 'book', label: 'Algorithms' },
    { type: 'add_node', nodeId: 'book-2', nodeType: 'book', label: 'Clean Code' },
    { type: 'add_node', nodeId: 'book-3', nodeType: 'book', label: 'Design Patterns' }
  );
  
  await delay(200);
  
  // Create edges
  events.push(
    { type: 'add_edge', from: 'student-1', to: 'book-1', edgeType: 'owns' },
    { type: 'add_edge', from: 'student-2', to: 'book-2', edgeType: 'owns' },
    { type: 'add_edge', from: 'student-1', to: 'book-2', edgeType: 'wants' },
    { type: 'add_edge', from: 'student-2', to: 'book-1', edgeType: 'wants' }
  );
  
  await delay(200);
  
  // BFS traversal
  events.push(
    { type: 'bfs_start', startNodeId: 'student-1' },
    { type: 'bfs_visit', nodeId: 'student-1' },
    { type: 'bfs_visit', nodeId: 'book-2' },
    { type: 'bfs_visit', nodeId: 'student-2' },
    { type: 'match_found', path: ['student-1', 'book-2', 'student-2'] }
  );

  return events;
}

export async function generateQueueDemo(): Promise<any[]> {
  const events: any[] = [];
  const sampleRequests = [
    { bookTitle: 'Clean Code', requester: 'Alice' },
    { bookTitle: 'Design Patterns', requester: 'Bob' },
    { bookTitle: 'Algorithms', requester: 'Carol' },
    { bookTitle: 'Refactoring', requester: 'Dave' }
  ];
  
  // Enqueue operations
  for (let i = 0; i < sampleRequests.length; i++) {
    const req = sampleRequests[i];
    events.push({
      type: 'enqueue',
      itemId: `demo-req-${i}`,
      data: req,
      queueSize: i + 1
    });
    await delay(200);
  }
  
  await delay(500);
  
  // Dequeue operations
  events.push(
    { type: 'peek', itemId: 'demo-req-0' }
  );
  
  await delay(300);
  
  for (let i = 0; i < 2; i++) {
    events.push({
      type: 'dequeue',
      itemId: `demo-req-${i}`,
      queueSize: sampleRequests.length - i - 1
    });
    await delay(300);
  }
  
  events.push({
    type: 'check_empty',
    isEmpty: false
  });

  return events;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
