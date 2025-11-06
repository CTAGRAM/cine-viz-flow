import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationRail } from "@/components/NavigationRail";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import AddBook from "./pages/AddBook";
import Search from "./pages/Search";
import MyList from "./pages/MyList";
import Visualizer from "./pages/Visualizer";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex min-h-screen w-full">
            <NavigationRail />
            <main className="flex-1 ml-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/add" element={<AddBook />} />
                <Route path="/search" element={<Search />} />
                <Route path="/my-list" element={<MyList />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/visualizer" element={<Visualizer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
