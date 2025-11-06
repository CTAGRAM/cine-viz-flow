import { VisualizationEvent } from '@/lib/dataStructures';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TreeNode {
  movie: {
    id: string;
    name: string;
    rating: number;
    posterUrl?: string;
  };
  left: TreeNode | null;
  right: TreeNode | null;
  height: number;
  size: number;
  x?: number;
  y?: number;
  balance?: number;
}

interface AVLTreeViewProps {
  events: VisualizationEvent[];
  root: TreeNode | null;
}

export function AVLTreeView({ events, root }: AVLTreeViewProps) {
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [rotationType, setRotationType] = useState<string | null>(null);
  const [rankedNodes, setRankedNodes] = useState<Map<string, number>>(new Map());
  const [narration, setNarration] = useState<string>('');

  useEffect(() => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];

    switch (lastEvent.type) {
      case 'avl-visit':
        setHighlightedNode(lastEvent.nodeId);
        setNarration(`Visiting node: ${lastEvent.nodeId} (⭐ ${lastEvent.rating}) - ${lastEvent.purpose}`);
        break;
      case 'avl-insert':
        setHighlightedNode(lastEvent.nodeId);
        setNarration(`✓ Inserted node: ${lastEvent.nodeId} (⭐ ${lastEvent.rating})`);
        break;
      case 'avl-delete':
        setNarration(`🗑️ Deleted node: ${lastEvent.nodeId}`);
        break;
      case 'avl-rotate':
        setRotationType(lastEvent.rotationType);
        setNarration(`🔄 ${lastEvent.rotationType} Rotation at ${lastEvent.pivotId}`);
        setTimeout(() => setRotationType(null), 2000);
        break;
      case 'avl-rank':
        setRankedNodes(prev => new Map(prev).set(lastEvent.nodeId, lastEvent.rank));
        setHighlightedNode(lastEvent.nodeId);
        setNarration(`⭐ Rank #${lastEvent.rank}: ${lastEvent.nodeId}`);
        break;
      case 'avl-update-metrics':
        setNarration(`Updated metrics for ${lastEvent.nodeId}`);
        break;
    }

    const timer = setTimeout(() => {
      setHighlightedNode(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [events]);

  const layoutTree = (node: TreeNode | null, x: number, y: number, horizontalSpacing: number): TreeNode | null => {
    if (!node) return null;
    
    const leftSpacing = horizontalSpacing / 2;
    const rightSpacing = horizontalSpacing / 2;
    
    return {
      movie: node.movie,
      height: node.height,
      size: node.size,
      balance: node.balance,
      x,
      y,
      left: layoutTree(node.left, x - leftSpacing, y + 120, leftSpacing),
      right: layoutTree(node.right, x + rightSpacing, y + 120, rightSpacing)
    };
  };

  const layoutRoot = root ? layoutTree(root, 500, 80, 200) : null;

  const renderNode = (node: TreeNode | null): JSX.Element[] => {
    if (!node || node.x === undefined || node.y === undefined) return [];

    const elements: JSX.Element[] = [];
    const isHighlighted = highlightedNode === node.movie.id;
    const rank = rankedNodes.get(node.movie.id);
    const clipId = `clip-circle-${node.movie.id}`;

    // Draw connections to children
    if (node.left && node.left.x !== undefined && node.left.y !== undefined) {
      elements.push(
        <motion.line
          key={`line-left-${node.movie.id}`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 0.5 }}
          x1={node.x}
          y1={node.y + 40}
          x2={node.left.x}
          y2={node.left.y - 10}
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
      );
    }

    if (node.right && node.right.x !== undefined && node.right.y !== undefined) {
      elements.push(
        <motion.line
          key={`line-right-${node.movie.id}`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 0.5 }}
          x1={node.x}
          y1={node.y + 40}
          x2={node.right.x}
          y2={node.right.y - 10}
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
      );
    }

    // Draw node
    elements.push(
      <motion.g
        key={`node-${node.movie.id}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isHighlighted ? 1.2 : 1,
          opacity: 1
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Clip path definition */}
        <defs>
          <clipPath id={clipId}>
            <circle cx={node.x} cy={node.y} r="30" />
          </clipPath>
        </defs>

        {/* Movie poster background */}
        {node.movie.posterUrl && (
          <image
            href={node.movie.posterUrl}
            x={node.x - 35}
            y={node.y - 35}
            width="70"
            height="70"
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        
        {/* Node circle border */}
        <circle
          cx={node.x}
          cy={node.y}
          r="35"
          fill={node.movie.posterUrl ? 'transparent' : (isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--card))')}
          stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
          strokeWidth="3"
        />

        {/* Semi-transparent overlay for text visibility when poster exists */}
        {node.movie.posterUrl && (
          <circle
            cx={node.x}
            cy={node.y}
            r="35"
            fill="hsl(var(--background))"
            opacity="0.7"
          />
        )}
        
        {/* Movie name abbreviation in center if no poster */}
        {!node.movie.posterUrl && (
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-foreground"
          >
            {node.movie.name.substring(0, 3)}
          </text>
        )}

        {/* Rating badge */}
        <circle
          cx={node.x + 25}
          cy={node.y - 25}
          r="18"
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth="2"
        />
        <text
          x={node.x + 25}
          y={node.y - 25}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold fill-primary-foreground"
        >
          {node.movie.rating}
        </text>

        {/* Rank badge */}
        {rank && (
          <g>
            <circle
              cx={node.x - 25}
              cy={node.y - 25}
              r="18"
              fill="hsl(var(--secondary))"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={node.x - 25}
              y={node.y - 25}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-bold fill-secondary-foreground"
            >
              #{rank}
            </text>
          </g>
        )}

        {/* Movie name */}
        <text
          x={node.x}
          y={node.y + 50}
          textAnchor="middle"
          className="text-xs font-medium fill-foreground"
        >
          {node.movie.name.substring(0, 12)}
        </text>

        {/* Balance factor */}
        {node.balance !== undefined && Math.abs(node.balance) > 1 && (
          <text
            x={node.x}
            y={node.y + 65}
            textAnchor="middle"
            className="text-xs font-bold fill-red-500"
          >
            B: {node.balance}
          </text>
        )}
      </motion.g>
    );

    // Recursively render children
    elements.push(...renderNode(node.left));
    elements.push(...renderNode(node.right));

    return elements;
  };

  const treeHeight = root?.height || 0;
  const nodeCount = root?.size || 0;
  const rotationCount = events.filter(e => e.type === 'avl-rotate').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background to-muted/30">
      {/* Narration */}
      <AnimatePresence mode="wait">
        {narration && (
          <motion.div
            key={narration}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary/10 text-primary px-6 py-3 text-center font-medium border-b flex items-center justify-center gap-2"
          >
            {narration}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">This tree automatically keeps books sorted by rating and stays balanced for fast lookups.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rotation Indicator */}
      <AnimatePresence>
        {rotationType && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute top-20 right-6 z-10 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg font-bold"
          >
            🔄 Rebalancing tree...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree Canvas with Zoom/Pan Controls */}
      <div className="flex-1 overflow-hidden relative">
        {layoutRoot ? (
          <TransformWrapper
            initialScale={0.8}
            minScale={0.3}
            maxScale={2}
            centerOnInit
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: false, mode: 'zoomIn' }}
          >
            {({ zoomIn, zoomOut, resetTransform, centerView }) => (
              <>
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-card/80 backdrop-blur-sm shadow-lg"
                          onClick={() => zoomIn()}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Zoom In</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-card/80 backdrop-blur-sm shadow-lg"
                          onClick={() => zoomOut()}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Zoom Out</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-card/80 backdrop-blur-sm shadow-lg"
                          onClick={() => centerView()}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Fit to Screen</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-card/80 backdrop-blur-sm shadow-lg"
                          onClick={() => resetTransform()}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Reset View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Zoomable/Pannable SVG */}
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <svg
                    className="w-[1200px] h-[800px]"
                    viewBox="0 0 1200 800"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {renderNode(layoutRoot)}
                  </svg>
                </TransformComponent>

                {/* Instructions overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-xs text-muted-foreground">
                  💡 Scroll to zoom • Drag to pan • Double-click to zoom in
                </div>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="space-y-2">
              <div className="text-4xl">🌳</div>
              <p className="text-muted-foreground">Tree is empty</p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      <div className="border-t bg-muted/50 px-6 py-3 flex items-center justify-around text-sm">
        <div>
          <span className="text-muted-foreground">Height:</span>
          <span className="ml-2 font-bold">{treeHeight}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Nodes:</span>
          <span className="ml-2 font-bold">{nodeCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rotations:</span>
          <span className="ml-2 font-bold text-yellow-500">{rotationCount}</span>
        </div>
      </div>
    </div>
  );
}
