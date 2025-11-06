import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationRail } from "@/components/NavigationRail";
import { LiveActivitySidebar } from "@/components/LiveActivitySidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { useDataInitialization } from "@/hooks/useDataInitialization";
import Home from "./pages/Home";
import AddBook from "./pages/AddBook";
import Search from "./pages/Search";
import MyList from "./pages/MyList";
import Visualizer from "./pages/Visualizer";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Matches from "./pages/Matches";
import SwapHistory from "./pages/SwapHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize data structures with Supabase data
  const { isLoading } = useDataInitialization();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <NavigationRail />
      <main className="ml-20 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add" element={<AddBook />} />
          <Route path="/search" element={<Search />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/history" element={<SwapHistory />} />
          <Route path="/visualizer" element={<Visualizer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <LiveActivitySidebar />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
