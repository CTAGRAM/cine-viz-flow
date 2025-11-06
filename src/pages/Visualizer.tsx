import { useEffect, useState } from 'react';
import { bookStore as movieStore } from '@/lib/bookStore';
import { visualizationEngine } from '@/lib/visualizationEngine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HashTableView } from '@/components/visualizer/HashTableView';
import { AVLTreeView } from '@/components/visualizer/AVLTreeView';
import { EventPlayer } from '@/components/visualizer/EventPlayer';
import { OperationBanner } from '@/components/visualizer/OperationBanner';
import { OperationHistory } from '@/components/visualizer/OperationHistory';
import { History, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

export default function Visualizer() {
  const navigate = useNavigate();
  const [playbackState, setPlaybackState] = useState(visualizationEngine.getState());
  const [hashBuckets, setHashBuckets] = useState(movieStore.getHashTable().getBuckets());
  const [avlRoot, setAvlRoot] = useState(movieStore.getAVLTree().getRoot());
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(visualizationEngine.getHistory());

  useEffect(() => {
    // Subscribe to visualization events
    const unsubscribe = visualizationEngine.subscribe(setPlaybackState);

    // Subscribe to movie store events
    movieStore.onEvents((events, operation) => {
      visualizationEngine.setEvents(events, operation);
      visualizationEngine.play();
      
      // Update data structures
      setHashBuckets([...movieStore.getHashTable().getBuckets()]);
      setAvlRoot(movieStore.getAVLTree().getRoot());
      setHistory(visualizationEngine.getHistory());
    });

    return unsubscribe;
  }, []);

  const handleReplay = (operation: any) => {
    // Can't truly replay without re-executing, but we can show it was selected
    setShowHistory(false);
  };

  const eventsUpToCurrent = visualizationEngine.getEventsUpToCurrent();

  return (
    <div className="h-screen flex bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DSA Visualizer</h1>
            <p className="text-sm text-muted-foreground">
              Watch data structures in action - Real-time step-by-step animations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Movie
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Operation Banner */}
        {playbackState.operation && playbackState.events.length > 0 && (
          <OperationBanner
            operation={playbackState.operation}
            progress={visualizationEngine.getProgressPercentage()}
            currentStep={playbackState.currentIndex + 1}
            totalSteps={playbackState.events.length}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="hash" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/50">
            <TabsTrigger value="hash">Hash Table</TabsTrigger>
            <TabsTrigger value="avl">AVL Tree</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
          </TabsList>

          <TabsContent value="hash" className="flex-1 m-0">
            <HashTableView
              events={eventsUpToCurrent}
              buckets={hashBuckets}
            />
          </TabsContent>

          <TabsContent value="avl" className="flex-1 m-0">
            <AVLTreeView
              events={eventsUpToCurrent}
              root={avlRoot}
            />
          </TabsContent>

          <TabsContent value="split" className="flex-1 m-0 grid grid-cols-2 gap-4 p-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 border-b">
                <h3 className="font-semibold text-sm">Hash Table</h3>
              </div>
              <HashTableView
                events={eventsUpToCurrent}
                buckets={hashBuckets}
              />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 border-b">
                <h3 className="font-semibold text-sm">AVL Tree</h3>
              </div>
              <AVLTreeView
                events={eventsUpToCurrent}
                root={avlRoot}
              />
            </div>
          </TabsContent>
          </Tabs>

          {/* Event Player */}
          {playbackState.events.length > 0 && (
            <EventPlayer
              state={playbackState}
              onPlay={() => visualizationEngine.play()}
              onPause={() => visualizationEngine.pause()}
              onStepForward={() => visualizationEngine.stepForward()}
              onStepBackward={() => visualizationEngine.stepBackward()}
              onSpeedChange={(speed) => visualizationEngine.setSpeed(speed)}
              onJumpTo={(index) => visualizationEngine.jumpTo(index)}
            />
          )}

          {/* Empty State */}
          {playbackState.events.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div className="space-y-4">
                <div className="text-6xl">🎬</div>
                <h3 className="text-2xl font-semibold">Ready to visualize!</h3>
                <p className="text-muted-foreground max-w-md">
                  Add, search, or update movies to see stunning real-time step-by-step animations of Hash Table and AVL Tree operations
                </p>
                <Button onClick={() => navigate('/add')} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Movie
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <OperationHistory
            history={history}
            onReplay={handleReplay}
            onClear={() => {
              visualizationEngine.clearHistory();
              setHistory([]);
            }}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
