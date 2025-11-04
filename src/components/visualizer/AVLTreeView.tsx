import { VisualizationEvent, Movie } from '@/lib/dataStructures';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface TreeNode {
  movie: Movie;
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
  root: any;
}

export function AVLTreeView({ events, root }: AVLTreeViewProps) {
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [rotationType, setRotationType] = useState<string | null>(null);
  const [rankedNodes, setRankedNodes] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (events.length === 0) return;

    const currentEvent = events[events.length - 1];

    // Reset highlights
    setHighlightedNode(null);
    setRotationType(null);

    // Apply highlights based on event type
    if (currentEvent.type === 'avl-visit' || currentEvent.type === 'avl-insert' || currentEvent.type === 'avl-delete') {
      setHighlightedNode(currentEvent.nodeId);
    } else if (currentEvent.type === 'avl-rotate') {
      setRotationType(currentEvent.rotationType);
      setHighlightedNode(currentEvent.pivotId);
    } else if (currentEvent.type === 'avl-rank') {
      setRankedNodes(prev => new Map(prev).set(currentEvent.nodeId, currentEvent.rank));
    }

    // Auto-clear highlight
    const timer = setTimeout(() => {
      setHighlightedNode(null);
      setRotationType(null);
    }, 800);

    return () => clearTimeout(timer);
  }, [events]);

  // Calculate tree layout
  const layoutTree = (node: any, depth = 0, offset = 0, width = 800): TreeNode | null => {
    if (!node) return null;

    const leftTree = layoutTree(node.left, depth + 1, offset, width / 2);
    const rightTree = layoutTree(node.right, depth + 1, offset + width / 2, width / 2);

    return {
      movie: node.movie,
      left: leftTree,
      right: rightTree,
      height: node.height,
      size: node.size,
      balance: node.balance,
      x: offset + width / 2,
      y: depth * 100 + 50
    };
  };

  const layoutRoot = root ? layoutTree(root) : null;

  // Render tree recursively
  const renderNode = (node: TreeNode | null, parentX?: number, parentY?: number): JSX.Element[] => {
    if (!node) return [];

    const elements: JSX.Element[] = [];
    const isHighlighted = highlightedNode === node.movie.id;
    const rank = rankedNodes.get(node.movie.id);

    // Draw edges to children
    if (node.left && node.x && node.y && node.left.x && node.left.y) {
      elements.push(
        <line
          key={`edge-left-${node.movie.id}`}
          x1={node.x}
          y1={node.y}
          x2={node.left.x}
          y2={node.left.y}
          className="stroke-border"
          strokeWidth="2"
        />
      );
    }
    if (node.right && node.x && node.y && node.right.x && node.right.y) {
      elements.push(
        <line
          key={`edge-right-${node.movie.id}`}
          x1={node.x}
          y1={node.y}
          x2={node.right.x}
          y2={node.right.y}
          className="stroke-border"
          strokeWidth="2"
        />
      );
    }

    // Recursively render children
    elements.push(...renderNode(node.left, node.x, node.y));
    elements.push(...renderNode(node.right, node.x, node.y));

    // Draw node
    if (node.x && node.y) {
      elements.push(
        <g key={`node-${node.movie.id}`} transform={`translate(${node.x},${node.y})`}>
          {/* Node circle */}
          <circle
            r="30"
            className={cn(
              "transition-all duration-300 fill-card stroke-2",
              isHighlighted
                ? "fill-primary stroke-primary animate-pulse-glow"
                : "stroke-border"
            )}
          />
          
          {/* Rating */}
          <text
            textAnchor="middle"
            dy="-5"
            className="text-xs font-bold fill-foreground"
          >
            {node.movie.rating}
          </text>
          
          {/* ID */}
          <text
            textAnchor="middle"
            dy="10"
            className="text-[10px] fill-muted-foreground"
          >
            {node.movie.id.slice(0, 6)}
          </text>

          {/* Metrics badges */}
          <text
            x="35"
            y="-20"
            className="text-[10px] fill-primary font-mono"
          >
            h:{node.height}
          </text>
          <text
            x="35"
            y="-8"
            className="text-[10px] fill-primary font-mono"
          >
            b:{node.balance}
          </text>
          <text
            x="35"
            y="4"
            className="text-[10px] fill-primary font-mono"
          >
            s:{node.size}
          </text>

          {/* Rank badge */}
          {rank && (
            <g transform="translate(-45, -10)">
              <circle r="12" className="fill-yellow-500" />
              <text
                textAnchor="middle"
                dy="4"
                className="text-xs font-bold fill-yellow-900"
              >
                #{rank}
              </text>
            </g>
          )}
        </g>
      );
    }

    return elements;
  };

  const treeHeight = root ? root.height * 100 + 100 : 200;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        {!layoutRoot ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🌳</div>
              <div>Tree is empty</div>
            </div>
          </div>
        ) : (
          <svg
            width="100%"
            height={treeHeight}
            viewBox="0 0 800 ${treeHeight}"
            className="mx-auto"
          >
            {renderNode(layoutRoot)}
          </svg>
        )}

        {/* Rotation label */}
        {rotationType && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-lg shadow-lg animate-fade-in">
            {rotationType} Rotation
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      <div className="border-t bg-muted/50 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{root?.height || 0}</div>
            <div className="text-xs text-muted-foreground">Height</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{root?.size || 0}</div>
            <div className="text-xs text-muted-foreground">Nodes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{events.filter(e => e.type === 'avl-rotate').length}</div>
            <div className="text-xs text-muted-foreground">Rotations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
