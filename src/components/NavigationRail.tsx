import { Home, Search, Plus, Heart, Layers, User, Inbox, Sparkles, History } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useEffect, useState } from "react";

export const NavigationRail = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState(0);
  
  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      
      // Set up real-time subscription for new requests
      const channel = supabase
        .channel('book_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'book_requests',
            filter: `owner_user_id=eq.${user.id}`
          },
          () => {
            fetchPendingRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id)
        .eq('status', 'pending');

      setPendingRequests(count || 0);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };
  
  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/matches", icon: Sparkles, label: "Matches" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/add", icon: Plus, label: "List a Book" },
    { to: "/my-list", icon: Heart, label: "My Books" },
    { to: "/requests", icon: Inbox, label: "Requests", badge: pendingRequests },
    { to: "/history", icon: History, label: "History" },
    { to: "/visualizer", icon: Layers, label: "Visualizer" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-8 gap-6 z-50">
      <div className="mb-4">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-xl text-primary-foreground">
          📚
        </div>
      </div>
      
      {user && (
        <div className="mb-4">
          <NotificationsDropdown />
        </div>
      )}
      
      {links.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )
          }
        >
          <div className="relative">
            <Icon className="w-6 h-6" />
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span className="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {label}
          </span>
        </NavLink>
      ))}
      
      <div className="mt-auto">
        <NavLink
          to={user ? "/profile" : "/auth"}
          className={({ isActive }) =>
            cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )
          }
        >
          <User className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {user ? "Profile" : "Sign In"}
          </span>
        </NavLink>
      </div>
    </nav>
  );
};
