import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sendEmailNotification } from '@/lib/emailNotifications';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RequestBookDialogProps {
  bookId: string;
  bookTitle: string;
  ownerId: string;
  ownerEmail?: string;
  onRequestSent?: () => void;
}

export const RequestBookDialog = ({ bookId, bookTitle, ownerId, ownerEmail, onRequestSent }: RequestBookDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!user) {
      toast.error('Please sign in to request books');
      navigate('/auth');
      return;
    }

    if (user.id === ownerId) {
      toast.error("You can't request your own book");
      return;
    }

    setLoading(true);
    try {
      // Check if user can request this book
      const { data: canRequest } = await supabase
        .rpc('can_request_book', { p_book_id: bookId, p_user_id: user.id });

      if (!canRequest) {
        toast.error('You already have a pending request for this book');
        setLoading(false);
        return;
      }

      // Create the request
      const { error } = await supabase
        .from('book_requests')
        .insert({
          book_id: bookId,
          requester_user_id: user.id,
          owner_user_id: ownerId,
          message: message || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Request sent successfully!');
      
      // Send email notification to owner
      if (ownerEmail) {
        // Get requester's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        await sendEmailNotification({
          to: ownerEmail,
          subject: 'New Book Request',
          type: 'request_received',
          data: {
            userName: profile?.full_name || 'A student',
            bookTitle,
            requestId: bookId,
            appUrl: window.location.origin,
          },
        });
      }
      
      setOpen(false);
      setMessage('');
      onRequestSent?.();
    } catch (error: any) {
      console.error('Error creating request:', error);
      if (error.code === '23505') {
        toast.error('You already have a request for this book');
      } else {
        toast.error('Failed to send request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Request Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request "{bookTitle}"</DialogTitle>
          <DialogDescription>
            Send a request to the book owner. They'll be notified and can accept or decline your request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Hi! I'm interested in this book for my course. Would love to exchange..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRequest} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};