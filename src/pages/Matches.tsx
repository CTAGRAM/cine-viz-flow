import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/lib/dataStructures';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Loader2, TrendingUp } from 'lucide-react';

interface BookMatch {
  book: Book;
  ownerId: string;
  ownerEmail: string;
  matchScore: number;
  matchReasons: string[];
  yourBook: Book;
}

const Matches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<BookMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [myBooks, setMyBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    findMatches();
  }, [user, navigate]);

  const findMatches = async () => {
    if (!user) return;

    try {
      // Fetch user's own books
      const { data: userBooksData, error: userBooksError } = await supabase
        .from('books')
        .select('*')
        .eq('owner_user_id', user.id);

      if (userBooksError) throw userBooksError;

      if (!userBooksData || userBooksData.length === 0) {
        setLoading(false);
        return;
      }

      // Convert to Book format
      const userBooks: Book[] = userBooksData.map((book: any) => ({
        id: book.id,
        name: book.title,
        rating: book.rating,
        author: book.author,
        subject: book.subject,
        condition: book.condition,
        year: book.year,
        posterUrl: book.poster_url,
        owner: '',
        available: book.available,
      }));

      setMyBooks(userBooks);

      // Fetch all other available books
      const { data: allBooksData, error: allBooksError } = await supabase
        .from('books')
        .select('*')
        .eq('available', true)
        .neq('owner_user_id', user.id);

      if (allBooksError) throw allBooksError;

      // Fetch profiles for owner names
      const userIds = [...new Set(allBooksData?.map(b => b.owner_user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, { name: p.full_name, email: p.email }]) || []);

      // Calculate matches
      const matchesFound: BookMatch[] = [];

      for (const userBook of userBooks) {
        for (const otherBookData of allBooksData || []) {
          const otherBook: Book = {
            id: otherBookData.id,
            name: otherBookData.title,
            rating: otherBookData.rating,
            author: otherBookData.author,
            subject: otherBookData.subject,
            condition: otherBookData.condition,
            year: otherBookData.year,
            posterUrl: otherBookData.poster_url,
            owner: profileMap.get(otherBookData.owner_user_id)?.name || 'Unknown',
            available: otherBookData.available,
          };

          const match = calculateMatch(userBook, otherBook);
          
          if (match.score > 0) {
            matchesFound.push({
              book: otherBook,
              ownerId: otherBookData.owner_user_id,
              ownerEmail: profileMap.get(otherBookData.owner_user_id)?.email || '',
              matchScore: match.score,
              matchReasons: match.reasons,
              yourBook: userBook,
            });
          }
        }
      }

      // Sort by match score (highest first)
      matchesFound.sort((a, b) => b.matchScore - a.matchScore);

      // Remove duplicates (same book matched multiple times)
      const uniqueMatches = matchesFound.filter((match, index, self) =>
        index === self.findIndex((m) => m.book.id === match.book.id)
      );

      setMatches(uniqueMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatch = (myBook: Book, theirBook: Book): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];

    // Subject match (highest priority)
    if (myBook.subject && theirBook.subject && myBook.subject === theirBook.subject) {
      score += 50;
      reasons.push(`Same subject: ${myBook.subject}`);
    }

    // Year proximity (within ±2 years)
    if (myBook.year && theirBook.year) {
      const yearDiff = Math.abs(myBook.year - theirBook.year);
      if (yearDiff <= 2) {
        const yearScore = 30 - (yearDiff * 10);
        score += yearScore;
        if (yearDiff === 0) {
          reasons.push(`Same year: ${myBook.year}`);
        } else {
          reasons.push(`Close year: ${theirBook.year} (±${yearDiff} years)`);
        }
      }
    }

    // High rating bonus
    if (theirBook.rating >= 8.5) {
      score += 15;
      reasons.push(`High quality: ${theirBook.rating.toFixed(1)}/10`);
    }

    // Good condition bonus
    if (theirBook.condition === 'New' || theirBook.condition === 'Good') {
      score += 5;
      reasons.push(`${theirBook.condition} condition`);
    }

    return { score, reasons };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (myBooks.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Matches For You</h1>
          <p className="text-muted-foreground">
            Discover books that match your interests
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">List books to get matches</h3>
            <p className="text-muted-foreground mb-6">
              Add your books first, and we'll find matching books from other students based on subject, year, and quality
            </p>
            <Button onClick={() => navigate('/add')}>
              List Your First Book
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Matches For You
        </h1>
        <p className="text-muted-foreground">
          Books that match your collection based on subject, year, and availability
        </p>
      </div>

      {/* Your Books Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Books
          </CardTitle>
          <CardDescription>
            We found {matches.length} potential matches based on your {myBooks.length} listed book{myBooks.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {myBooks.map((book) => (
              <Badge key={book.id} variant="outline" className="text-sm">
                {book.name} {book.subject && `(${book.subject})`}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matches */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground">
              No matching books found at the moment. Check back later as more students list their books!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <Card key={match.book.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                {/* Book Image */}
                <div className="flex-shrink-0">
                  <div className="w-32 aspect-[2/3] rounded-lg overflow-hidden bg-muted border">
                    {match.book.posterUrl ? (
                      <img
                        src={match.book.posterUrl}
                        alt={match.book.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                        {match.book.name[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-2xl font-bold">{match.book.name}</h3>
                        {match.book.author && (
                          <p className="text-muted-foreground italic">{match.book.author}</p>
                        )}
                      </div>
                      <Badge className="text-lg px-3 py-1">
                        {match.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-3">
                      <Badge variant="secondary">
                        ⭐ {match.book.rating.toFixed(1)}/10
                      </Badge>
                      {match.book.subject && (
                        <Badge variant="outline">{match.book.subject}</Badge>
                      )}
                      {match.book.year && (
                        <Badge variant="outline">{match.book.year}</Badge>
                      )}
                      {match.book.condition && (
                        <Badge variant="outline">{match.book.condition}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">Why this matches:</p>
                    <ul className="space-y-1">
                      {match.matchReasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Matches with your book: <span className="font-semibold">{match.yourBook.name}</span>
                    </p>
                  </div>

                  {/* Owner Info & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Offered by: </span>
                      <span className="font-semibold">{match.book.owner}</span>
                    </div>
                    <Button onClick={() => {
                      // Open book details modal
                      const bookCard = document.querySelector(`[data-book-id="${match.book.id}"]`);
                      if (bookCard) {
                        (bookCard as HTMLElement).click();
                      }
                    }}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      View & Request
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hidden BookCard for modal functionality */}
              <div className="hidden">
                <div data-book-id={match.book.id}>
                  <BookCard book={match.book} ownerId={match.ownerId} ownerEmail={match.ownerEmail} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;