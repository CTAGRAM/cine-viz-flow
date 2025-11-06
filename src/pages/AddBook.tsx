import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookStore as movieStore } from "@/lib/bookStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Dices, BookOpen } from "lucide-react";

const RANDOM_BOOKS = [
  { id: 'isbn-978-0134685991', name: 'Effective Java', author: 'Joshua Bloch', rating: 9.2, subject: 'Computer Science', condition: 'Good', posterUrl: 'https://images-na.ssl-images-amazon.com/images/I/71F8H2-5-nL.jpg', year: 2018, owner: 'Random User', available: true },
  { id: 'isbn-978-0262033848', name: 'Introduction to Algorithms', author: 'Cormen, Leiserson', rating: 9.5, subject: 'Computer Science', condition: 'New', posterUrl: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/', year: 2009, owner: 'Random User', available: true },
  { id: 'isbn-978-0132350884', name: 'Clean Code', author: 'Robert C. Martin', rating: 8.9, subject: 'Computer Science', condition: 'Good', posterUrl: 'https://m.media-amazon.com/images/I/51E2055ZGUL.jpg', year: 2008, owner: 'Random User', available: true },
  { id: 'isbn-978-0073383095', name: 'Linear Algebra and Its Applications', author: 'David C. Lay', rating: 8.7, subject: 'Mathematics', condition: 'Fair', posterUrl: 'https://m.media-amazon.com/images/I/51Dc8dGRUSL.jpg', year: 2015, owner: 'Random User', available: true },
  { id: 'isbn-978-0201633610', name: 'Design Patterns', author: 'Gang of Four', rating: 9.0, subject: 'Computer Science', condition: 'Good', posterUrl: 'https://images-na.ssl-images-amazon.com/images/I/51szD9HC9pL.jpg', year: 1994, owner: 'Random User', available: true },
  { id: 'isbn-978-1292024448', name: 'Physics for Scientists', author: 'Raymond A. Serway', rating: 9.1, subject: 'Physics', condition: 'Good', posterUrl: 'https://m.media-amazon.com/images/I/51RXZ9YGNVL.jpg', year: 2014, owner: 'Random User', available: true },
];

export default function AddBook() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    author: "",
    rating: "",
    subject: "",
    condition: "",
    posterUrl: "",
    year: "",
    owner: "",
  });

  useEffect(() => {
    if (editId) {
      const loadBook = async () => {
        const book = await movieStore.searchBook(editId);
        if (book) {
          setFormData({
            id: book.id,
            name: book.name,
            author: book.author || "",
            rating: book.rating.toString(),
            subject: book.subject || "",
            condition: book.condition || "",
            posterUrl: book.posterUrl || "",
            year: book.year?.toString() || "",
            owner: book.owner || "",
          });
        }
      };
      loadBook();
    }
  }, [editId]);

  const handleAddRandom = async () => {
    const randomBook = RANDOM_BOOKS[Math.floor(Math.random() * RANDOM_BOOKS.length)];
    
    await movieStore.addBook(randomBook);
    
    toast.success(`Added "${randomBook.name}" randomly!`, {
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
      author: formData.author || undefined,
      rating,
      subject: formData.subject || undefined,
      condition: formData.condition || undefined,
      posterUrl: formData.posterUrl || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
      owner: formData.owner || undefined,
      available: true,
    });

    toast.success(editId ? "Book updated successfully!" : "Book listed successfully!");
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
            <h1 className="text-4xl font-display font-bold mb-2">{editId ? "Edit Book" : "List a Book"}</h1>
            <p className="text-muted-foreground">
              {editId ? "Update book details and watch structures rebalance" : "List a book for exchange and watch the data structures update in real-time"}
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
              📚 Add Random Book
            </Button>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="id">ISBN / Book ID *</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., isbn-978-0134685991"
                  className="font-mono"
                  disabled={!!editId}
                  required
                />
                <p className="text-xs text-muted-foreground">Unique identifier for the book</p>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Book Title *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Book title"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="Literature">Literature</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Economics">Economics</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Book condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Quality Score *</Label>
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
                <Label htmlFor="year">Publication Year</Label>
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

              <div className="space-y-2 col-span-2">
                <Label htmlFor="owner">Owner / Your Name</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="posterUrl">Cover Image URL</Label>
                <Input
                  id="posterUrl"
                  type="url"
                  value={formData.posterUrl}
                  onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" size="lg" className="flex-1">
                <BookOpen className="w-4 h-4 mr-2" />
                {editId ? "Update Book" : "List Book"}
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
