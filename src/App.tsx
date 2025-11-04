import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationRail } from "@/components/NavigationRail";
import Home from "./pages/Home";
import AddMovie from "./pages/AddMovie";
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
              <Route path="/search" element={<div className="p-16 text-2xl">Search (Coming Soon)</div>} />
              <Route path="/my-list" element={<div className="p-16 text-2xl">My List (Coming Soon)</div>} />
              <Route path="/visualizer" element={<div className="p-16 text-2xl">Visualizer (Coming Soon)</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
