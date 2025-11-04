import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { movieStore } from "@/lib/movieStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AddMovie() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    rating: "",
    posterUrl: "",
    year: "",
  });

  useEffect(() => {
    if (editId) {
      const loadMovie = async () => {
        const movie = await movieStore.searchMovie(editId);
        if (movie) {
          setFormData({
            id: movie.id,
            name: movie.name,
            rating: movie.rating.toString(),
            posterUrl: movie.posterUrl || "",
            year: movie.year?.toString() || "",
          });
        }
      };
      loadMovie();
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.name || !formData.rating) {
      toast.error("Please fill in all required fields");
      return;
    }

    const rating = parseFloat(formData.rating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      toast.error("Rating must be between 0 and 10");
      return;
    }

    await movieStore.addMovie({
      id: formData.id,
      name: formData.name,
      rating,
      posterUrl: formData.posterUrl || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
    });

    toast.success(editId ? "Movie updated successfully!" : "Movie added successfully!");
    navigate("/visualizer");
  };

  return (
    <div className="min-h-screen bg-background px-16 py-12">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 -ml-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{editId ? "Edit Movie" : "Add Movie"}</h1>
            <p className="text-muted-foreground">
              {editId ? "Update movie details and watch structures rebalance" : "Add a new movie to your catalog and watch the data structures update in real-time"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-border">
            <div className="space-y-2">
              <Label htmlFor="id">Movie ID *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., tt1234567"
                className="font-mono"
                disabled={!!editId}
                required
              />
              <p className="text-xs text-muted-foreground">Unique identifier for the movie</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Title *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Movie title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">IMDb Rating *</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                placeholder="8.5"
                required
              />
              <p className="text-xs text-muted-foreground">Rating from 0.0 to 10.0</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posterUrl">Poster URL</Label>
              <Input
                id="posterUrl"
                type="url"
                value={formData.posterUrl}
                onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1800"
                max="2100"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2024"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" size="lg" className="flex-1">
                {editId ? "Update Movie" : "Add Movie"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => navigate("/visualizer")}
              >
                View Visualizer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
