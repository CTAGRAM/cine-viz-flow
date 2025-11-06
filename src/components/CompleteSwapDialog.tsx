import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, Loader2, Star } from 'lucide-react';

interface CompleteSwapDialogProps {
  requestId: string;
  bookTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  isRequester: boolean;
}

export const CompleteSwapDialog = ({
  requestId,
  bookTitle,
  open,
  onOpenChange,
  onComplete,
  isRequester,
}: CompleteSwapDialogProps) => {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('complete_swap', {
        p_request_id: requestId,
        p_rating: rating > 0 ? rating : null,
        p_feedback: feedback || null,
      });

      if (error) throw error;

      toast.success('Swap completed successfully!');
      onOpenChange(false);
      setRating(0);
      setFeedback('');
      onComplete?.();
    } catch (error: any) {
      console.error('Error completing swap:', error);
      toast.error('Failed to complete swap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Complete Exchange
          </DialogTitle>
          <DialogDescription>
            Mark "{bookTitle}" as successfully exchanged
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isRequester && (
            <>
              {/* Rating */}
              <div className="space-y-2">
                <Label>Rate your experience (optional)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share your experience with this exchange..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}

          {!isRequester && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This will mark the book as exchanged and complete the request. The requester will
                be able to provide feedback about the exchange.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleComplete} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Exchange
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};