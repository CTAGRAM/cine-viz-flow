import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationRail } from "@/components/NavigationRail";
import Home from "./pages/Home";
import AddMovie from "./pages/AddMovie";
import Search from "./pages/Search";
import MyList from "./pages/MyList";
import Visualizer from "./pages/Visualizer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full">
          <NavigationRail />
          <main className="flex-1 ml-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddMovie />} />
              <Route path="/search" element={<Search />} />
              <Route path="/my-list" element={<MyList />} />
              <Route path="/visualizer" element={<Visualizer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
