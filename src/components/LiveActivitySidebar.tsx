import { useState, useEffect } from 'react';
import { Activity, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveActivityFeed } from '@/components/visualizer/LiveActivityFeed';
import { cn } from '@/lib/utils';

export const LiveActivitySidebar = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('liveActivitySidebarOpen');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('liveActivitySidebarOpen', String(isOpen));
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - Fixed position */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-40"
          size="icon"
        >
          <Activity className="w-6 h-6" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-screen bg-background border-l border-border transition-all duration-300 ease-in-out z-50",
          isOpen ? "w-96 translate-x-0" : "w-0 translate-x-full"
        )}
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Live Activity</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Activity Feed */}
            <div className="flex-1 overflow-hidden">
              <LiveActivityFeed />
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
