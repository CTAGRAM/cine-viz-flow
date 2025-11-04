import { useEffect, useState } from 'react';
import { movieStore } from '@/lib/movieStore';
import { visualizationEngine } from '@/lib/visualizationEngine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HashTableView } from '@/components/visualizer/HashTableView';
import { AVLTreeView } from '@/components/visualizer/AVLTreeView';
import { EventPlayer } from '@/components/visualizer/EventPlayer';
import { PseudocodeStrip } from '@/components/visualizer/PseudocodeStrip';
import { EventLog } from '@/components/visualizer/EventLog';

export default function Visualizer() {
  const [playbackState, setPlaybackState] = useState(visualizationEngine.getState());
  const [hashBuckets, setHashBuckets] = useState(movieStore.getHashTable().getBuckets());
  const [avlRoot, setAvlRoot] = useState(movieStore.getAVLTree().getRoot());

  useEffect(() => {
    // Subscribe to visualization events
    const unsubscribe = visualizationEngine.subscribe(setPlaybackState);

    // Subscribe to movie store events
    movieStore.onEvents((events) => {
      visualizationEngine.setEvents(events);
      visualizationEngine.play();
      
      // Update data structures
      setHashBuckets([...movieStore.getHashTable().getBuckets()]);
      setAvlRoot(movieStore.getAVLTree().getRoot());
    });

    return unsubscribe;
  }, []);

  const eventsUpToCurrent = visualizationEngine.getEventsUpToCurrent();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold">DSA Visualizer</h1>
        <p className="text-sm text-muted-foreground">
          Watch data structures in action - Hash Table & AVL Tree operations
        </p>
      </div>

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

        {/* Pseudocode Strip */}
        <PseudocodeStrip />

        {/* Event Log */}
        {playbackState.events.length > 0 && (
          <EventLog
            events={playbackState.events}
            currentIndex={playbackState.currentIndex}
            onEventClick={(index) => visualizationEngine.jumpTo(index)}
          />
        )}

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
          <div className="flex items-center justify-center p-12 text-center">
            <div className="space-y-2">
              <div className="text-4xl">🎬</div>
              <h3 className="text-lg font-semibold">No events yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Add, search, or update movies to see real-time visualizations of Hash Table and AVL Tree operations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
