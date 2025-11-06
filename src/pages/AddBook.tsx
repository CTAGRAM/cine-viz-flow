import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, BookOpen } from "lucide-react";
import { bookStore } from "@/lib/bookStore";
import { Book } from "@/lib/dataStructures";

const RANDOM_BOOKS = [
  { id: 'isbn-978-0262033848', name: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', rating: 9.5, subject: 'Computer Science', condition: 'New', posterUrl: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/', year: 2009, owner: 'Random User', available: true },
  { id: 'isbn-978-0321573513', name: 'Algorithms', author: 'Robert Sedgewick, Kevin Wayne', rating: 9.3, subject: 'Computer Science', condition: 'Good', posterUrl: 'https://algs4.cs.princeton.edu/cover.png', year: 2011, owner: 'Random User', available: true },
  { id: 'isbn-978-1848000698', name: 'The Algorithm Design Manual', author: 'Steven S. Skiena', rating: 9.1, subject: 'Computer Science', condition: 'Good', posterUrl: 'https://www.algorist.com/images/adm3cover.jpg', year: 2020, owner: 'Random User', available: true },
  { id: 'isbn-978-1617292231', name: 'Grokking Algorithms', author: 'Aditya Bhargava', rating: 8.9, subject: 'Computer Science', condition: 'New', posterUrl: 'https://images.manning.com/360/480/resize/book/2/1f8808e-1d56-40d7-96e1-7fcb5f79da93/Bhargava-Grokking-2ed-HI.png', year: 2016, owner: 'Random User', available: true },
  { id: 'isbn-978-0984782857', name: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', rating: 9.0, subject: 'Computer Science', condition: 'Good', posterUrl: 'https://images-na.ssl-images-amazon.com/images/I/51l5XzLln5L.jpg', year: 2015, owner: 'Random User', available: true },
  { id: 'isbn-978-0672324536', name: 'Data Structures and Algorithms in Java', author: 'Robert Lafore', rating: 8.7, subject: 'Computer Science', condition: 'Fair', posterUrl: 'https://m.media-amazon.com/images/I/51XJbWIhCbL.jpg', year: 2002, owner: 'Random User', available: true },
];

export default function AddBook() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  });

  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to list books");
      navigate("/auth");
      return;
    }

    if (editId) {
      const loadBook = async () => {
        const { data: book, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', editId)
          .eq('owner_user_id', user.id)
          .single();

        if (error) {
          toast.error("Book not found or you don't have permission to edit it");
          navigate('/');
          return;
        }

        if (book) {
          setFormData({
            id: book.id,
            name: book.title,
            author: book.author || "",
            rating: book.rating.toString(),
            subject: book.subject || "",
            condition: book.condition || "",
            posterUrl: book.poster_url || "",
            year: book.year?.toString() || "",
          });
        }
      };
      loadBook();
    }
  }, [editId, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to list books");
      navigate("/auth");
      return;
    }

    if (!formData.id || !formData.name || !formData.author || !formData.rating) {
      toast.error("Please fill in all required fields (ISBN, Title, Author, and Rating)");
      return;
    }

    const rating = parseFloat(formData.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      toast.error("Rating must be between 0 and 5");
      return;
    }

    try {
      const bookData = {
        id: formData.id,
        title: formData.name,
        author: formData.author,
        rating,
        subject: formData.subject || null,
        condition: formData.condition || null,
        poster_url: formData.posterUrl || null,
        year: formData.year ? parseInt(formData.year) : null,
        owner_user_id: user.id,
        available: true,
      };

      if (editId) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editId)
          .eq('owner_user_id', user.id);

        if (error) throw error;
        
        // Trigger visualization for update
        await bookStore.addBook({
          id: formData.id,
          name: formData.name,
          author: formData.author,
          rating,
          subject: formData.subject || '',
          condition: formData.condition || '',
          posterUrl: formData.posterUrl || '',
          year: formData.year ? parseInt(formData.year) : 0,
          owner: user.id,
          available: true
        });
        
        toast.success("Book updated successfully! Check the visualizer to see the operation.");
      } else {
        const { error } = await supabase
          .from('books')
          .insert(bookData);

        if (error) throw error;
        
        // Trigger visualization for new book
        await bookStore.addBook({
          id: formData.id,
          name: formData.name,
          author: formData.author,
          rating,
          subject: formData.subject || '',
          condition: formData.condition || '',
          posterUrl: formData.posterUrl || '',
          year: formData.year ? parseInt(formData.year) : 0,
          owner: user.id,
          available: true
        });
        
        toast.success("Book listed successfully! Check the visualizer to see the operation.");
      }

      navigate("/");
    } catch (error: any) {
      console.error('Error saving book:', error);
      if (error.code === '23505') {
        toast.error("A book with this ISBN already exists");
      } else {
        toast.error("Failed to save book. Please try again.");
      }
    }
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
              {editId ? "Update your book details" : "List a book for exchange with other students"}
            </p>
          </div>

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
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  required
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
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="4.5"
                  required
                />
                <p className="text-xs text-muted-foreground">Rating from 0.0 to 5.0</p>
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
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
