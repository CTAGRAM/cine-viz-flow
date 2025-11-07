import { useEffect, useState, useRef } from 'react';
import { GraphVisualizationEvent, GraphNode, GraphEdge } from '@/lib/graphDataStructure';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize2, User, BookOpen, TrendingUp, Minimize2, GripHorizontal, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [graphHeight, setGraphHeight] = useState(500);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = graphHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(300, Math.min(800, startHeightRef.current + deltaY));
      setGraphHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, graphHeight]);

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

  const getEdgeColor = (edge: GraphEdge, isHighlighted: boolean, isHovered: boolean) => {
    if (isHighlighted || isHovered) return 'hsl(var(--graph-highlight))';
    switch (edge.type) {
      case 'owns': return 'hsl(var(--graph-edge-owns))';
      case 'wants': return 'hsl(var(--graph-edge-wants))';
      case 'swap': return 'hsl(var(--graph-edge-swap))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getEdgeWidth = (edge: GraphEdge, isHighlighted: boolean, isHovered: boolean) => {
    if (isHighlighted || isHovered) return 4;
    switch (edge.type) {
      case 'swap': return 3;
      case 'owns': return 2.5;
      case 'wants': return 2;
      default: return 2;
    }
  };

  const getNodeColor = (node: GraphNode, isHighlighted: boolean, isHovered: boolean) => {
    if (isHighlighted || isHovered) return 'hsl(var(--graph-highlight))';
    return node.type === 'student' ? 'hsl(var(--graph-student))' : 'hsl(var(--graph-book))';
  };

  const getConnectedNodes = (nodeId: string) => {
    const connected = new Set<string>();
    edges.forEach(edge => {
      if (edge.from === nodeId) connected.add(edge.to);
      if (edge.to === nodeId) connected.add(edge.from);
    });
    return connected;
  };

  const getConnectedEdges = (nodeId: string) => {
    return edges.filter(edge => edge.from === nodeId || edge.to === nodeId);
  };

  // Create curved path for edge
  const createCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const sweep = dx > 0 ? 1 : 0;
    return `M ${x1},${y1} A ${dr},${dr} 0 0,${sweep} ${x2},${y2}`;
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

  const renderGraph = (height?: number) => (
    <div className="flex-1 border rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted relative" style={height ? { height: `${height}px` } : {}}>
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
              {!isMaximized && (
                <Button size="icon" variant="outline" onClick={() => setIsMaximized(true)}>
                  <Maximize className="h-4 w-4" />
                </Button>
              )}
            </div>
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <svg width="1000" height="800" className="w-full h-full">
                <defs>
                  <linearGradient id="studentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--graph-student))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--graph-student))" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--graph-book))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--graph-book))" stopOpacity="0.7" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {edges.map((edge, i) => {
                  const fromPos = positions.get(edge.from);
                  const toPos = positions.get(edge.to);
                  if (!fromPos || !toPos) return null;

                  const isHighlighted = highlightedEdges.has(`${edge.from}-${edge.to}`);
                  const isHovered = hoveredEdge === `${edge.from}-${edge.to}` ||
                                   hoveredNode === edge.from || hoveredNode === edge.to;
                  const color = getEdgeColor(edge, isHighlighted, isHovered);
                  const width = getEdgeWidth(edge, isHighlighted, isHovered);
                  const path = createCurvedPath(fromPos.x, fromPos.y, toPos.x, toPos.y);

                  const dx = toPos.x - fromPos.x;
                  const dy = toPos.y - fromPos.y;
                  const angle = Math.atan2(dy, dx);
                  const arrowSize = 8;
                  const offset = nodes.find(n => n.id === edge.to)?.type === 'student' ? 35 : 30;
                  const arrowX = toPos.x - Math.cos(angle) * offset;
                  const arrowY = toPos.y - Math.sin(angle) * offset;

                  return (
                    <g 
                      key={`edge-${i}`}
                      onMouseEnter={() => setHoveredEdge(`${edge.from}-${edge.to}`)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <path
                        d={path}
                        stroke={color}
                        strokeWidth={width}
                        strokeOpacity={(isHighlighted || isHovered) ? 0.9 : 0.5}
                        strokeDasharray={edge.type === 'wants' ? '5,5' : 'none'}
                        fill="none"
                        className={isHighlighted ? 'animate-pulse' : ''}
                        filter={(isHighlighted || isHovered) ? 'url(#glow)' : 'none'}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      <polygon
                        points={`${arrowX},${arrowY} ${arrowX - arrowSize * Math.cos(angle - Math.PI / 6)},${arrowY - arrowSize * Math.sin(angle - Math.PI / 6)} ${arrowX - arrowSize * Math.cos(angle + Math.PI / 6)},${arrowY - arrowSize * Math.sin(angle + Math.PI / 6)}`}
                        fill={color}
                        opacity={(isHighlighted || isHovered) ? 0.9 : 0.6}
                      />
                    </g>
                  );
                })}

                <TooltipProvider>
                  {nodes.map(node => {
                    const pos = positions.get(node.id);
                    if (!pos) return null;

                    const isHighlighted = highlightedNodes.has(node.id);
                    const isHovered = hoveredNode === node.id;
                    const connectedNodes = getConnectedNodes(node.id);
                    const color = getNodeColor(node, isHighlighted, isHovered);
                    const level = visitLevel.get(node.id);
                    const size = node.type === 'student' ? 35 : 30;

                    return (
                      <g 
                        key={node.id}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={pos.x + 2}
                          cy={pos.y + 2}
                          r={size}
                          fill="black"
                          opacity="0.1"
                        />
                        
                        {node.type === 'student' ? (
                          <polygon
                            points={`${pos.x},${pos.y - size} ${pos.x + size * 0.866},${pos.y - size * 0.5} ${pos.x + size * 0.866},${pos.y + size * 0.5} ${pos.x},${pos.y + size} ${pos.x - size * 0.866},${pos.y + size * 0.5} ${pos.x - size * 0.866},${pos.y - size * 0.5}`}
                            fill={isHighlighted || isHovered ? color : 'url(#studentGradient)'}
                            stroke="hsl(var(--border))"
                            strokeWidth={(isHighlighted || isHovered) ? 3 : 2}
                            className={isHighlighted ? 'animate-pulse' : ''}
                            filter={(isHighlighted || isHovered) ? 'url(#glow)' : 'none'}
                            style={{ transition: 'all 0.3s ease' }}
                          />
                        ) : (
                          <rect
                            x={pos.x - size * 0.8}
                            y={pos.y - size * 0.6}
                            width={size * 1.6}
                            height={size * 1.2}
                            rx="8"
                            fill={isHighlighted || isHovered ? color : 'url(#bookGradient)'}
                            stroke="hsl(var(--border))"
                            strokeWidth={(isHighlighted || isHovered) ? 3 : 2}
                            className={isHighlighted ? 'animate-pulse' : ''}
                            filter={(isHighlighted || isHovered) ? 'url(#glow)' : 'none'}
                            style={{ transition: 'all 0.3s ease' }}
                          />
                        )}

                        <g transform={`translate(${pos.x - 8}, ${pos.y - 8})`}>
                          {node.type === 'student' ? (
                            <path
                              d="M8 0C5.79 0 4 1.79 4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                              fill="white"
                              transform="scale(1)"
                            />
                          ) : (
                            <path
                              d="M3 0C1.9 0 1.01.9 1.01 2L1 14c0 1.1.89 2 1.99 2H13c1.1 0 2-.9 2-2V6l-6-6H3zm7 7V1.5L14.5 7H10z"
                              fill="white"
                              transform="scale(1)"
                            />
                          )}
                        </g>

                        <text
                          x={pos.x}
                          y={pos.y + size + 15}
                          textAnchor="middle"
                          className="text-xs font-medium fill-foreground"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label}
                        </text>

                        {level !== undefined && (
                          <g>
                            <rect
                              x={pos.x - 15}
                              y={pos.y - size - 25}
                              width="30"
                              height="18"
                              rx="9"
                              fill="hsl(var(--primary))"
                              opacity="0.9"
                            />
                            <text
                              x={pos.x}
                              y={pos.y - size - 13}
                              textAnchor="middle"
                              className="text-xs font-bold fill-primary-foreground"
                            >
                              L{level}
                            </text>
                          </g>
                        )}

                        {(isHovered) && (
                          <g>
                            <circle
                              cx={pos.x + size - 8}
                              cy={pos.y - size + 8}
                              r="10"
                              fill="hsl(var(--graph-highlight))"
                            />
                            <text
                              x={pos.x + size - 8}
                              y={pos.y - size + 8}
                              textAnchor="middle"
                              dy=".3em"
                              className="text-xs font-bold fill-white"
                            >
                              {connectedNodes.size}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </TooltipProvider>
              </svg>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Narration */}
      {narration && (
        <div className="bg-accent/50 p-4 rounded-lg mb-4 animate-fade-in">
          <p className="text-sm font-medium">{narration}</p>
        </div>
      )}

      {/* Legend - Floating Panel */}
      <Card className="absolute top-4 left-4 z-10 p-3 space-y-2 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-4 h-4" style={{ color: 'hsl(var(--graph-student))' }} />
            <span>Students</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--graph-book))' }} />
            <span>Books</span>
          </div>
          <div className="border-t pt-1.5 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 rounded" style={{ backgroundColor: 'hsl(var(--graph-edge-owns))' }} />
              <span>Owns</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 rounded" style={{ backgroundColor: 'hsl(var(--graph-edge-wants))' }} />
              <span>Wants</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-1 rounded" style={{ backgroundColor: 'hsl(var(--graph-edge-swap))' }} />
              <span>Swapped</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Graph Canvas with Resizable Height */}
      {renderGraph(graphHeight)}

      {/* Drag Handle */}
      <div 
        className={`flex items-center justify-center py-2 cursor-ns-resize hover:bg-accent/50 transition-colors ${isDragging ? 'bg-accent/70' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Maximized Graph Dialog */}
      <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Graph Visualization - Expanded View</span>
              <Button size="icon" variant="ghost" onClick={() => setIsMaximized(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {renderGraph()}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Statistics - Enhanced */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
        <Card className="p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <User className="w-6 h-6 mx-auto mb-2" style={{ color: 'hsl(var(--graph-student))' }} />
          <div className="text-2xl font-bold">{nodes.filter(n => n.type === 'student').length}</div>
          <div className="text-xs text-muted-foreground">Students</div>
        </Card>
        <Card className="p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: 'hsl(var(--graph-book))' }} />
          <div className="text-2xl font-bold">{nodes.filter(n => n.type === 'book').length}</div>
          <div className="text-xs text-muted-foreground">Books</div>
        </Card>
        <Card className="p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{edges.length}</div>
          <div className="text-xs text-muted-foreground">Connections</div>
        </Card>
        <Card className="p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-green-600">{matchPaths.length}</div>
          <div className="text-xs text-muted-foreground">Matches</div>
        </Card>
        <Card className="p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-orange-600">
            {edges.length > 0 ? (edges.length / nodes.length).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-muted-foreground">Avg Connections</div>
        </Card>
      </div>
    </div>
  );
};
