import { Home, Search, Plus, Heart, Layers, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export const NavigationRail = () => {
  const { user } = useAuth();
  
  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/add", icon: Plus, label: "List a Book" },
    { to: "/my-list", icon: Heart, label: "My Books" },
    { to: "/visualizer", icon: Layers, label: "Visualizer" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-8 gap-6 z-50">
      <div className="mb-4">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-xl text-primary-foreground">
          📚
        </div>
      </div>
      
      {links.map(({ to, icon: Icon, label }) => (
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
          <Icon className="w-6 h-6" />
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
