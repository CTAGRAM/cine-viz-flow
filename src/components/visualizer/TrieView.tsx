import { useEffect, useState } from 'react';
import { TrieVisualizationEvent } from '@/lib/trieDataStructure';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrieViewProps {
  events: TrieVisualizationEvent[];
}

interface TrieNodeViz {
  char: string;
  path: string;
  isEndOfWord: boolean;
  children: TrieNodeViz[];
  x?: number;
  y?: number;
}

export const TrieView = ({ events }: TrieViewProps) => {
  const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(new Set());
  const [narration, setNarration] = useState('');
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [trieStructure, setTrieStructure] = useState<TrieNodeViz | null>(null);

  useEffect(() => {
    if (events.length === 0) return;

    const newHighlightedPaths = new Set<string>();
    const structure: TrieNodeViz = { char: 'root', path: '', isEndOfWord: false, children: [] };

    events.forEach(event => {
      switch (event.type) {
        case 'insert_start':
          setNarration(`Inserting word: "${event.word}"`);
          break;
        case 'create_node':
          newHighlightedPaths.add(event.path);
          setNarration(`Creating new node for '${event.char}' at path: ${event.path}`);
          addNodeToStructure(structure, event.path, event.char, false);
          break;
        case 'traverse_node':
          newHighlightedPaths.add(event.path);
          setNarration(`Traversing existing node '${event.char}' at path: ${event.path}`);
          break;
        case 'mark_end':
          newHighlightedPaths.add(event.path);
          setNarration(`Marked end of word at path: ${event.path}`);
          markEndOfWord(structure, event.path);
          break;
        case 'search_start':
          setNarration(`Searching for prefix: "${event.prefix}"`);
          setSearchMatches([]);
          break;
        case 'search_step':
          newHighlightedPaths.add(event.path);
          if (event.found) {
            setNarration(`Found '${event.char}' at path: ${event.path}`);
          } else {
            setNarration(`Character '${event.char}' not found - no matches`);
          }
          break;
        case 'search_complete':
          setSearchMatches(event.matches);
          if (event.matches.length > 0) {
            setNarration(`Found ${event.matches.length} match(es)`);
          } else {
            setNarration('No matches found');
          }
          break;
        case 'highlight_path':
          newHighlightedPaths.add(event.path);
          setNarration(event.reason);
          break;
      }
    });

    setHighlightedPaths(newHighlightedPaths);
    setTrieStructure(calculatePositions(structure));

    const timeout = setTimeout(() => {
      setHighlightedPaths(new Set());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [events]);

  const addNodeToStructure = (root: TrieNodeViz, path: string, char: string, isEnd: boolean) => {
    if (path.length === 0) return;

    let current = root;
    for (let i = 0; i < path.length; i++) {
      const c = path[i];
      let child = current.children.find(ch => ch.char === c);
      
      if (!child) {
        child = { 
          char: c, 
          path: path.substring(0, i + 1), 
          isEndOfWord: i === path.length - 1 ? isEnd : false,
          children: [] 
        };
        current.children.push(child);
      }
      
      current = child;
    }
  };

  const markEndOfWord = (root: TrieNodeViz, path: string) => {
    let current = root;
    for (const c of path) {
      const child = current.children.find(ch => ch.char === c);
      if (child) current = child;
    }
    current.isEndOfWord = true;
  };

  const calculatePositions = (root: TrieNodeViz): TrieNodeViz => {
    const levelGap = 80;
    const nodeGap = 60;

    const assignPositions = (node: TrieNodeViz, level: number, leftBound: number, rightBound: number) => {
      const x = (leftBound + rightBound) / 2;
      const y = level * levelGap + 50;
      node.x = x;
      node.y = y;

      const childCount = node.children.length;
      if (childCount > 0) {
        const totalWidth = childCount * nodeGap;
        const startX = x - totalWidth / 2;
        
        node.children.forEach((child, i) => {
          const childLeft = startX + i * nodeGap;
          const childRight = childLeft + nodeGap;
          assignPositions(child, level + 1, childLeft, childRight);
        });
      }
    };

    assignPositions(root, 0, 0, 800);
    return root;
  };

  const renderNode = (node: TrieNodeViz): JSX.Element[] => {
    if (!node.x || !node.y) return [];

    const elements: JSX.Element[] = [];
    const isHighlighted = highlightedPaths.has(node.path);

    // Draw connections to children
    node.children.forEach(child => {
      if (child.x && child.y) {
        elements.push(
          <line
            key={`line-${node.path}-${child.path}`}
            x1={node.x}
            y1={node.y}
            x2={child.x}
            y2={child.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={isHighlighted ? 2 : 1}
            opacity={isHighlighted ? 1 : 0.5}
          />
        );
      }
    });

    // Draw node
    elements.push(
      <g key={`node-${node.path}`}>
        <circle
          cx={node.x}
          cy={node.y}
          r={20}
          fill={node.isEndOfWord ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
          stroke="hsl(var(--border))"
          strokeWidth={isHighlighted ? 3 : 1}
          className={isHighlighted ? 'animate-pulse' : ''}
        />
        <text
          x={node.x}
          y={node.y}
          textAnchor="middle"
          dy=".3em"
          className="text-sm font-bold fill-foreground"
        >
          {node.char}
        </text>
        {node.isEndOfWord && (
          <circle
            cx={node.x + 15}
            cy={node.y - 15}
            r={5}
            fill="hsl(var(--success))"
          />
        )}
      </g>
    );

    // Recursively render children
    node.children.forEach(child => {
      elements.push(...renderNode(child));
    });

    return elements;
  };

  if (!trieStructure || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No trie data available. Search for books to build the trie structure.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Narration */}
      {narration && (
        <div className="bg-accent/50 p-4 rounded-lg mb-4 animate-fade-in">
          <p className="text-sm font-medium">{narration}</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <Badge variant="outline">
          <div className="w-3 h-3 rounded-full bg-secondary mr-2" />
          Trie Node
        </Badge>
        <Badge variant="outline">
          <div className="w-3 h-3 rounded-full bg-primary mr-2" />
          End of Word
        </Badge>
        <Badge variant="outline">
          <div className="w-2 h-2 rounded-full bg-success mr-2" />
          Word Marker
        </Badge>
      </div>

      {/* Trie Canvas */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-background">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={2}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button size="icon" variant="outline" onClick={() => zoomIn()}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => zoomOut()}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => resetTransform()}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <svg width="1000" height="800" className="w-full h-full">
                  {renderNode(trieStructure)}
                </svg>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Search Matches */}
      {searchMatches.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Search Results ({searchMatches.length}):</h3>
          <div className="flex flex-wrap gap-2">
            {searchMatches.slice(0, 20).map((match, i) => (
              <Badge key={i} variant="secondary">
                {match}
              </Badge>
            ))}
            {searchMatches.length > 20 && (
              <Badge variant="outline">+{searchMatches.length - 20} more</Badge>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="flex gap-4 mt-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{searchMatches.length}</div>
          <div className="text-xs text-muted-foreground">Matches Found</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{events.filter(e => e.type === 'create_node').length}</div>
          <div className="text-xs text-muted-foreground">Nodes Created</div>
        </div>
      </div>
    </div>
  );
};
