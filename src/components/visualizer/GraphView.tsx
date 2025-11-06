import { useEffect, useState } from 'react';
import { GraphVisualizationEvent, GraphNode, GraphEdge } from '@/lib/graphDataStructure';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraphViewProps {
  events: any[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const GraphView = ({ events, nodes, edges }: GraphViewProps) => {
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [narration, setNarration] = useState('');
  const [matchPaths, setMatchPaths] = useState<string[][]>([]);
  const [visitLevel, setVisitLevel] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    const newHighlightedNodes = new Set<string>();
    const newHighlightedEdges = new Set<string>();
    const levels = new Map<string, number>();

    events.forEach(event => {
      switch (event.type) {
        case 'add_node':
          newHighlightedNodes.add(event.nodeId);
          setNarration(`Added ${event.nodeType} node: ${event.label}`);
          break;
        case 'add_edge':
          newHighlightedEdges.add(`${event.from}-${event.to}`);
          setNarration(`Added ${event.edgeType} edge from ${event.from} to ${event.to}`);
          break;
        case 'bfs_start':
          setNarration(`Starting BFS traversal from ${event.startNode}`);
          newHighlightedNodes.add(event.startNode);
          break;
        case 'bfs_visit':
          newHighlightedNodes.add(event.nodeId);
          levels.set(event.nodeId, event.level);
          setNarration(`Visiting node ${event.nodeId} at level ${event.level}`);
          break;
        case 'bfs_explore':
          newHighlightedEdges.add(`${event.from}-${event.to}`);
          setNarration(`Exploring edge from ${event.from} to ${event.to}`);
          break;
        case 'match_found':
          setMatchPaths(prev => [...prev, event.path]);
          setNarration(event.description);
          event.path.forEach(nodeId => newHighlightedNodes.add(nodeId));
          break;
        case 'highlight_node':
          newHighlightedNodes.add(event.nodeId);
          setNarration(event.reason);
          break;
      }
    });

    setHighlightedNodes(newHighlightedNodes);
    setHighlightedEdges(newHighlightedEdges);
    setVisitLevel(levels);

    const timeout = setTimeout(() => {
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [events]);

  // Calculate node positions using force-directed layout simulation
  const getNodePositions = () => {
    const positions = new Map<string, { x: number; y: number }>();
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Separate students and books
    const studentNodes = nodes.filter(n => n.type === 'student');
    const bookNodes = nodes.filter(n => n.type === 'book');

    // Position students in a circle on the left
    studentNodes.forEach((node, i) => {
      const angle = (i / studentNodes.length) * 2 * Math.PI;
      const radius = 150;
      positions.set(node.id, {
        x: centerX - 200 + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });

    // Position books in a circle on the right
    bookNodes.forEach((node, i) => {
      const angle = (i / bookNodes.length) * 2 * Math.PI;
      const radius = 150;
      positions.set(node.id, {
        x: centerX + 200 + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });

    return positions;
  };

  const positions = getNodePositions();

  const getEdgeColor = (edge: GraphEdge, isHighlighted: boolean) => {
    if (isHighlighted) return 'hsl(var(--primary))';
    switch (edge.type) {
      case 'owns': return 'hsl(var(--success))';
      case 'wants': return 'hsl(var(--warning))';
      case 'swap': return 'hsl(var(--chart-1))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getNodeColor = (node: GraphNode, isHighlighted: boolean) => {
    if (isHighlighted) return 'hsl(var(--primary))';
    return node.type === 'student' ? 'hsl(var(--accent))' : 'hsl(var(--secondary))';
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No graph data available. Perform operations to build the matching graph.
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
          <div className="w-3 h-3 rounded-full bg-accent mr-2" />
          Students
        </Badge>
        <Badge variant="outline">
          <div className="w-3 h-3 rounded-full bg-secondary mr-2" />
          Books
        </Badge>
        <Badge variant="outline">
          <div className="w-3 h-3 bg-success mr-2" />
          Owns
        </Badge>
        <Badge variant="outline">
          <div className="w-3 h-3 bg-warning mr-2" />
          Wants
        </Badge>
        <Badge variant="outline">
          <div className="w-3 h-3 bg-chart-1 mr-2" />
          Swapped
        </Badge>
      </div>

      {/* Graph Canvas */}
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
                  {/* Draw edges */}
                  {edges.map((edge, i) => {
                    const fromPos = positions.get(edge.from);
                    const toPos = positions.get(edge.to);
                    if (!fromPos || !toPos) return null;

                    const isHighlighted = highlightedEdges.has(`${edge.from}-${edge.to}`);
                    const color = getEdgeColor(edge, isHighlighted);

                    return (
                      <g key={`edge-${i}`}>
                        <line
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke={color}
                          strokeWidth={isHighlighted ? 3 : 2}
                          strokeOpacity={isHighlighted ? 1 : 0.6}
                          className={isHighlighted ? 'animate-pulse' : ''}
                        />
                        {/* Arrow head */}
                        <polygon
                          points={`${toPos.x},${toPos.y} ${toPos.x - 10},${toPos.y - 5} ${toPos.x - 10},${toPos.y + 5}`}
                          fill={color}
                          opacity={isHighlighted ? 1 : 0.6}
                        />
                      </g>
                    );
                  })}

                  {/* Draw nodes */}
                  {nodes.map(node => {
                    const pos = positions.get(node.id);
                    if (!pos) return null;

                    const isHighlighted = highlightedNodes.has(node.id);
                    const color = getNodeColor(node, isHighlighted);
                    const level = visitLevel.get(node.id);

                    return (
                      <g key={node.id}>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={node.type === 'student' ? 30 : 25}
                          fill={color}
                          stroke="hsl(var(--border))"
                          strokeWidth={isHighlighted ? 3 : 1}
                          className={isHighlighted ? 'animate-pulse' : ''}
                        />
                        <text
                          x={pos.x}
                          y={pos.y}
                          textAnchor="middle"
                          dy=".3em"
                          className="text-xs font-medium fill-foreground"
                        >
                          {node.label.length > 10 ? node.label.substring(0, 10) + '...' : node.label}
                        </text>
                        {level !== undefined && (
                          <text
                            x={pos.x}
                            y={pos.y - 40}
                            textAnchor="middle"
                            className="text-xs font-bold fill-primary"
                          >
                            L{level}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Matches Found */}
      {matchPaths.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Matches Found:</h3>
          {matchPaths.map((path, i) => (
            <Badge key={i} variant="secondary" className="mr-2 mb-2">
              {path.join(' → ')}
            </Badge>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="flex gap-4 mt-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{nodes.length}</div>
          <div className="text-xs text-muted-foreground">Total Nodes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{edges.length}</div>
          <div className="text-xs text-muted-foreground">Total Edges</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{matchPaths.length}</div>
          <div className="text-xs text-muted-foreground">Matches Found</div>
        </div>
      </div>
    </div>
  );
};
