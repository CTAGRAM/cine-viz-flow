import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { History, Star, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Swap {
  id: string;
  book_id: string;
  book_title: string;
  book_author: string | null;
  book_poster_url: string | null;
  swap_date: string;
  rating: number | null;
  feedback: string | null;
  from_user_id: string;
  to_user_id: string;
  from_user_name: string;
  to_user_name: string;
}

const SwapHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSwapHistory();
  }, [user, navigate]);

  const fetchSwapHistory = async () => {
    if (!user) return;

    try {
      // Fetch swaps where user was involved
      const { data: swapsData, error } = await supabase
        .from('swaps')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('swap_date', { ascending: false });

      if (error) throw error;

      if (!swapsData || swapsData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch book and user details
      const bookIds = [...new Set(swapsData.map(s => s.book_id))];
      const userIds = [...new Set([
        ...swapsData.map(s => s.from_user_id),
        ...swapsData.map(s => s.to_user_id),
      ])];

      const [{ data: booksData }, { data: profilesData }] = await Promise.all([
        supabase.from('books').select('id, title, author, poster_url').in('id', bookIds),
        supabase.from('profiles').select('id, full_name').in('id', userIds),
      ]);

      const bookMap = new Map(booksData?.map(b => [b.id, b]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

      const formattedSwaps: Swap[] = swapsData.map((swap: any) => {
        const book = bookMap.get(swap.book_id);
        return {
          id: swap.id,
          book_id: swap.book_id,
          book_title: book?.title || 'Unknown',
          book_author: book?.author,
          book_poster_url: book?.poster_url,
          swap_date: swap.swap_date,
          rating: swap.rating,
          feedback: swap.feedback,
          from_user_id: swap.from_user_id,
          to_user_id: swap.to_user_id,
          from_user_name: profileMap.get(swap.from_user_id) || 'Unknown',
          to_user_name: profileMap.get(swap.to_user_id) || 'Unknown',
        };
      });

      setSwaps(formattedSwaps);
    } catch (error) {
      console.error('Error fetching swap history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
          <History className="w-8 h-8" />
          Swap History
        </h1>
        <p className="text-muted-foreground">
          View your completed book exchanges and feedback
        </p>
      </div>

      {swaps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No swaps yet</h3>
            <p className="text-muted-foreground mb-6">
              When you complete book exchanges, they'll appear here
            </p>
            <Button onClick={() => navigate('/requests')}>View Requests</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {swaps.map((swap) => {
            const isGiver = swap.from_user_id === user?.id;
            const otherUserName = isGiver ? swap.to_user_name : swap.from_user_name;

            return (
              <Card key={swap.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {swap.book_poster_url && (
                        <img
                          src={swap.book_poster_url}
                          alt={swap.book_title}
                          className="w-20 h-28 object-cover rounded"
                        />
                      )}
                      <div>
                        <CardTitle className="text-xl">{swap.book_title}</CardTitle>
                        {swap.book_author && (
                          <CardDescription>{swap.book_author}</CardDescription>
                        )}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={isGiver ? 'secondary' : 'default'}>
                              {isGiver ? 'Given Away' : 'Received'}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              {isGiver ? 'To:' : 'From:'}
                            </span>{' '}
                            <span className="font-semibold">{otherUserName}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(swap.swap_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {(swap.rating || swap.feedback) && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      {swap.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Rating:</span>
                          {renderStars(swap.rating)}
                        </div>
                      )}
                      {swap.feedback && (
                        <div>
                          <p className="text-sm font-semibold mb-1">Feedback:</p>
                          <p className="text-sm text-muted-foreground italic">
                            "{swap.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SwapHistory;