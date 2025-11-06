import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookStore as movieStore } from "@/lib/bookStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Dices } from "lucide-react";

const RANDOM_MOVIES = [
  { id: 'tt0111161', name: 'The Shawshank Redemption', rating: 9.3, posterUrl: 'https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg', year: 1994 },
  { id: 'tt0068646', name: 'The Godfather', rating: 9.2, posterUrl: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', year: 1972 },
  { id: 'tt0468569', name: 'The Dark Knight', rating: 9.0, posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', year: 2008 },
  { id: 'tt0071562', name: 'The Godfather Part II', rating: 9.0, posterUrl: 'https://m.media-amazon.com/images/M/MV5BMWMwMGQzZTItY2JlNC00OWZiLWIyMDctNDk2ZDQ2YjRjMWQ0XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', year: 1974 },
  { id: 'tt0050083', name: '12 Angry Men', rating: 9.0, posterUrl: 'https://m.media-amazon.com/images/M/MV5BMWU4N2FjNzYtNTVkNC00NzQ0LTg0MjAtYTJlMjFhNGUxZDFmXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_SX300.jpg', year: 1957 },
  { id: 'tt0108052', name: "Schindler's List", rating: 8.9, posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE4OTMxMTctNmRhYy00NWE2LTg3YzItYTk3M2UwOTU5Njg4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg', year: 1993 },
  { id: 'tt0167260', name: 'The Lord of the Rings: The Return of the King', rating: 8.9, posterUrl: 'https://m.media-amazon.com/images/M/MV5BNzA5ZDNlZWMtM2NhNS00NDJjLTk4NDItYTRmY2EwMWZlMTY3XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', year: 2003 },
  { id: 'tt0110912', name: 'Pulp Fiction', rating: 8.8, posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', year: 1994 },
  { id: 'tt0120737', name: 'The Lord of the Rings: The Fellowship of the Ring', rating: 8.8, posterUrl: 'https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_SX300.jpg', year: 2001 },
  { id: 'tt0060196', name: 'The Good, the Bad and the Ugly', rating: 8.8, posterUrl: 'https://m.media-amazon.com/images/M/MV5BOTQ5NDI3MTI4MF5BMl5BanBnXkFtZTgwNDQ4ODE5MDE@._V1_SX300.jpg', year: 1966 },
  { id: 'tt0109830', name: 'Forrest Gump', rating: 8.8, posterUrl: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg', year: 1994 },
  { id: 'tt0137523', name: 'Fight Club', rating: 8.7, posterUrl: 'https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', year: 1999 },
  { id: 'tt0133093', name: 'The Matrix', rating: 8.7, posterUrl: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg', year: 1999 },
  { id: 'tt0099685', name: 'Goodfellas', rating: 8.7, posterUrl: 'https://m.media-amazon.com/images/M/MV5BY2NkZjEzMDgtN2RjYy00YzM1LWI4ZmQtMjIwYjFjNmI3ZGEwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', year: 1990 },
  { id: 'tt1375666', name: 'Inception', rating: 8.8, posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', year: 2010 },
  { id: 'tt0073486', name: "One Flew Over the Cuckoo's Nest", rating: 8.6, posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjA0OWVhOTAtYWQxNi00YzNhLWI4ZjYtNjFjZTEyYjJlNDVlL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg', year: 1975 },
  { id: 'tt0114369', name: 'Se7en', rating: 8.6, posterUrl: 'https://m.media-amazon.com/images/M/MV5BOTUwODM5MTctZjczMi00OTk4LTg3NWUtNmVhMTAzNTNjYjcyXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg', year: 1995 },
  { id: 'tt0167261', name: 'The Lord of the Rings: The Two Towers', rating: 8.7, posterUrl: 'https://m.media-amazon.com/images/M/MV5BZGMxZTdjZmYtMmE2Ni00ZTdkLWI5NTgtNjlmMjBiNzU2MmI5XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg', year: 2002 },
  { id: 'tt0038650', name: "It's a Wonderful Life", rating: 8.6, posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjc4NDZhZWMtNGEzYS00ZWU2LThlM2ItNTA0YzQ0OTExMTE2XkEyXkFqcGdeQXVyNjUwMzI2NzU@._V1_SX300.jpg', year: 1946 },
  { id: 'tt0120815', name: 'Saving Private Ryan', rating: 8.6, posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjhkMDM4MWItZTVjOC00ZDRhLThmYTAtM2I5NzBmNmNlMzI1XkEyXkFqcGdeQXVyNDYyMDk5MTU@._V1_SX300.jpg', year: 1998 },
];

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
      const loadBook = async () => {
        const book = await movieStore.searchBook(editId);
        if (book) {
          setFormData({
            id: book.id,
            name: book.name,
            rating: book.rating.toString(),
            posterUrl: book.posterUrl || "",
            year: book.year?.toString() || "",
          });
        }
      };
      loadBook();
    }
  }, [editId]);

  const handleAddRandom = async () => {
    const randomMovie = RANDOM_MOVIES[Math.floor(Math.random() * RANDOM_MOVIES.length)];
    
    await movieStore.addBook(randomMovie);
    
    toast.success(`Added "${randomMovie.name}" randomly!`, {
      description: "Watch the visualization in action"
    });
    navigate("/visualizer");
  };

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

    await movieStore.addBook({
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

          {!editId && (
            <Button
              type="button"
              onClick={handleAddRandom}
              size="lg"
              variant="outline"
              className="w-full border-2 border-dashed hover:border-primary"
            >
              <Dices className="w-5 h-5 mr-2" />
              🎲 Add Random Movie
            </Button>
          )}

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
