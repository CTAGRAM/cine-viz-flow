import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Hash, TreeDeciduous, Search, GitBranch, List } from 'lucide-react';

interface VisualizationEvent {
  id: string;
  user_id: string;
  operation_type: string;
  data_structure: string;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<VisualizationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial activities
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('visualization-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visualization_events'
        },
        (payload) => {
          console.log('New activity:', payload);
          fetchActivities(); // Refetch to get profile data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('visualization_events')
        .select(`
          *,
          profiles!visualization_events_user_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (dataStructure: string) => {
    switch (dataStructure) {
      case 'hash_table': return <Hash className="h-4 w-4" />;
      case 'avl_tree': return <TreeDeciduous className="h-4 w-4" />;
      case 'trie': return <Search className="h-4 w-4" />;
      case 'graph': return <GitBranch className="h-4 w-4" />;
      case 'queue': return <List className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getOperationColor = (operationType: string) => {
    switch (operationType) {
      case 'ADD': return 'bg-success';
      case 'SEARCH': return 'bg-primary';
      case 'UPDATE': return 'bg-warning';
      case 'DELETE': return 'bg-destructive';
      case 'MATCH': return 'bg-chart-1';
      case 'TOP_K': return 'bg-chart-2';
      default: return 'bg-muted';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="font-semibold">Live Activity Feed</h3>
        <Badge variant="outline" className="ml-auto">
          {activities.length} events
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
            >
              <div className={`p-2 rounded-full ${getOperationColor(activity.operation_type)}`}>
                {getIcon(activity.data_structure)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {activity.profiles?.full_name || 'Unknown User'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {activity.operation_type}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground truncate">
                  {activity.metadata?.description || 
                   `Performed ${activity.operation_type} on ${activity.data_structure}`}
                </p>
                
                {activity.metadata?.bookName && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Book: {activity.metadata.bookName}
                  </p>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {formatTime(activity.created_at)}
                </span>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No activity yet. Start using the system to see live updates!
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
