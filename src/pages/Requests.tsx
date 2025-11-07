import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { requestQueue } from '@/lib/queueDataStructure';
import { saveVisualizationEvent } from '@/hooks/useVisualizationSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CompleteSwapDialog } from '@/components/CompleteSwapDialog';
import { sendEmailNotification } from '@/lib/emailNotifications';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Inbox, Send, CheckCircle, XCircle, Clock, Loader2, Lock, Mail, Phone } from 'lucide-react';

interface BookRequest {
  id: string;
  book_id: string;
  status: string;
  message: string | null;
  created_at: string;
  book_title: string;
  book_author: string | null;
  book_poster_url: string | null;
  requester_name: string;
  requester_email: string;
  requester_contact: string | null;
  owner_name: string;
  owner_email: string;
  owner_contact: string | null;
}

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingRequests, setIncomingRequests] = useState<BookRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completeSwapDialog, setCompleteSwapDialog] = useState<{
    open: boolean;
    requestId: string;
    bookTitle: string;
    isRequester: boolean;
  }>({ open: false, requestId: '', bookTitle: '', isRequester: false });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      // Set up queue event listener
      const queueEvents: any[] = [];
      requestQueue.addListener((events) => {
        queueEvents.push(...events);
      });

      // Fetch incoming requests (requests for my books)
      const { data: incomingRequests, error: incomingError } = await supabase
        .from('book_requests')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (incomingError) {
        console.error('Incoming requests error:', incomingError);
        throw incomingError;
      }

      // Fetch related data for incoming requests
      const formattedIncoming = await Promise.all((incomingRequests || []).map(async (req: any) => {
        const { data: book } = await supabase
          .from('books')
          .select('title, author, poster_url')
          .eq('id', req.book_id)
          .single();

        const { data: requester } = await supabase
          .from('profiles')
          .select('full_name, email, contact_info')
          .eq('id', req.requester_user_id)
          .single();

        return {
          id: req.id,
          book_id: req.book_id,
          status: req.status,
          message: req.message,
          created_at: req.created_at,
          book_title: book?.title || 'Unknown',
          book_author: book?.author,
          book_poster_url: book?.poster_url,
          requester_name: requester?.full_name || 'Unknown',
          requester_email: requester?.email || '',
          requester_contact: requester?.contact_info,
          owner_name: '',
          owner_email: '',
          owner_contact: null,
        };
      }));

      setIncomingRequests(formattedIncoming);

      // Fetch outgoing requests (my requests)
      const { data: outgoingRequests, error: outgoingError } = await supabase
        .from('book_requests')
        .select('*')
        .eq('requester_user_id', user.id)
        .order('created_at', { ascending: false });

      if (outgoingError) {
        console.error('Outgoing requests error:', outgoingError);
        throw outgoingError;
      }

      // Fetch related data for outgoing requests
      const formattedOutgoing = await Promise.all((outgoingRequests || []).map(async (req: any) => {
        const { data: book } = await supabase
          .from('books')
          .select('title, author, poster_url, owner_user_id')
          .eq('id', req.book_id)
          .single();

        const { data: owner } = await supabase
          .from('profiles')
          .select('full_name, email, contact_info')
          .eq('id', req.owner_user_id)
          .single();

        return {
          id: req.id,
          book_id: req.book_id,
          status: req.status,
          message: req.message,
          created_at: req.created_at,
          book_title: book?.title || 'Unknown',
          book_author: book?.author,
          book_poster_url: book?.poster_url,
          requester_name: '',
          requester_email: '',
          requester_contact: null,
          owner_name: owner?.full_name || 'Unknown',
          owner_email: owner?.email || '',
          owner_contact: owner?.contact_info,
        };
      }));

      setOutgoingRequests(formattedOutgoing);

      // Populate queue with pending requests
      requestQueue.clear();
      const bookRequestMap = new Map<string, any[]>();
      
      [...formattedIncoming, ...formattedOutgoing]
        .filter(req => req.status === 'pending')
        .forEach(req => {
          if (!bookRequestMap.has(req.book_id)) {
            bookRequestMap.set(req.book_id, []);
          }
          bookRequestMap.get(req.book_id)!.push(req);
        });

      // Enqueue ALL pending requests
      bookRequestMap.forEach((requests, bookId) => {
        requests.forEach((req, index) => {
          requestQueue.enqueue({
            requestId: req.id,
            bookId: req.book_id,
            bookTitle: req.book_title,
            requester_name: req.requester_name || req.owner_name,
            timestamp: new Date(req.created_at).getTime(),
          }, requests.length - index);
        });
      });
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const request = incomingRequests.find(r => r.id === requestId);
      
      // Capture queue events BEFORE modification
      const queueEvents: any[] = [];
      requestQueue.addListener((events) => {
        queueEvents.push(...events);
      });
      
      const queueItem = requestQueue.getItems().find(item => item.data.requestId === requestId);
      if (queueItem) {
        requestQueue.remove(queueItem.id);
      }
      
      // Capture events before they're cleared
      const capturedEvents = [...queueEvents];
      
      const { error } = await supabase
        .from('book_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request accepted!');
      
      // Save queue visualization with captured events
      if (capturedEvents.length > 0) {
        await saveVisualizationEvent('DELETE', 'queue', capturedEvents, {
          description: `Accepted request and dequeued from queue`,
          requestId: requestId,
        });
      }
      
      // Send email notification
      if (request) {
        await sendEmailNotification({
          to: request.requester_email,
          subject: 'Your Book Request Was Accepted!',
          type: 'request_accepted',
          data: {
            userName: request.owner_name || 'the owner',
            bookTitle: request.book_title,
            requestId: request.id,
            appUrl: window.location.origin,
          },
        });
      }
      
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      // Capture queue events BEFORE modification
      const queueEvents: any[] = [];
      requestQueue.addListener((events) => {
        queueEvents.push(...events);
      });
      
      const queueItem = requestQueue.getItems().find(item => item.data.requestId === requestId);
      if (queueItem) {
        requestQueue.remove(queueItem.id);
      }
      
      // Capture events before they're cleared
      const capturedEvents = [...queueEvents];
      
      const { error } = await supabase
        .from('book_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request rejected');
      
      // Save queue visualization with captured events
      if (capturedEvents.length > 0) {
        await saveVisualizationEvent('DELETE', 'queue', capturedEvents, {
          description: `Rejected request and dequeued from queue`,
          requestId: requestId,
        });
      }
      
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('book_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request cancelled');
      fetchRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = () => {
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
      accepted: { variant: 'default', icon: Lock, label: 'Reserved' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
      completed: { variant: 'secondary', icon: CheckCircle, label: 'Completed' },
      cancelled: { variant: 'secondary', icon: XCircle, label: 'Cancelled' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
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
        <h1 className="text-4xl font-display font-bold mb-2">Book Requests</h1>
        <p className="text-muted-foreground">
          Manage incoming requests for your books and track your outgoing requests
        </p>
      </div>

      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Inbox ({incomingRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="outbox" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent ({outgoingRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground">
                  When someone requests your books, they'll appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            incomingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {request.book_poster_url && (
                        <img
                          src={request.book_poster_url}
                          alt={request.book_title}
                          className="w-20 h-28 object-cover rounded"
                        />
                      )}
                      <div>
                        <CardTitle className="text-xl">{request.book_title}</CardTitle>
                        {request.book_author && (
                          <CardDescription>{request.book_author}</CardDescription>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            <span className="font-semibold">From:</span> {request.requester_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                {request.message && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                  </CardContent>
                )}
                {request.status === 'pending' && (
                  <CardContent className="flex gap-3 pt-0">
                    <Button
                      onClick={() => handleAccept(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Accept'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </CardContent>
                )}
                {request.status === 'accepted' && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Contact Information:
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${request.requester_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                            {request.requester_email}
                          </a>
                        </div>
                        {request.requester_contact && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4" />
                            <span className="text-blue-800 dark:text-blue-200">{request.requester_contact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        setCompleteSwapDialog({
                          open: true,
                          requestId: request.id,
                          bookTitle: request.book_title,
                          isRequester: false,
                        })
                      }
                      disabled={actionLoading === request.id}
                      variant="secondary"
                    >
                      Complete Exchange
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="outbox" className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No requests sent</h3>
                <p className="text-muted-foreground">
                  Browse books and send requests to get started
                </p>
                <Button className="mt-4" onClick={() => navigate('/')}>
                  Browse Books
                </Button>
              </CardContent>
            </Card>
          ) : (
            outgoingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {request.book_poster_url && (
                        <img
                          src={request.book_poster_url}
                          alt={request.book_title}
                          className="w-20 h-28 object-cover rounded"
                        />
                      )}
                      <div>
                        <CardTitle className="text-xl">{request.book_title}</CardTitle>
                        {request.book_author && (
                          <CardDescription>{request.book_author}</CardDescription>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            <span className="font-semibold">Owner:</span> {request.owner_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                {request.message && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">
                      Your message: "{request.message}"
                    </p>
                  </CardContent>
                )}
                {request.status === 'pending' && (
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(request.id)}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Cancel Request'
                      )}
                    </Button>
                  </CardContent>
                )}
                {request.status === 'accepted' && (
                  <CardContent className="pt-0">
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-3">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                        ✓ Request reserved! Contact the owner to arrange the exchange.
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                        This book is now reserved for you. Other requests have been automatically rejected.
                      </p>
                      <div className="bg-white dark:bg-gray-900 p-3 rounded border border-green-200 dark:border-green-800 space-y-2">
                        <p className="text-sm font-semibold">Contact Information:</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${request.owner_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {request.owner_email}
                            </a>
                          </div>
                          {request.owner_contact && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4" />
                              <span>{request.owner_contact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CompleteSwapDialog
        requestId={completeSwapDialog.requestId}
        bookTitle={completeSwapDialog.bookTitle}
        open={completeSwapDialog.open}
        onOpenChange={(open) =>
          setCompleteSwapDialog((prev) => ({ ...prev, open }))
        }
        onComplete={handleComplete}
        isRequester={completeSwapDialog.isRequester}
      />
    </div>
  );
};

export default Requests;