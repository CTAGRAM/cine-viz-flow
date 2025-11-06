-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('request_received', 'request_accepted', 'request_rejected', 'request_completed', 'new_match')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger to create notifications on request status changes
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book_title TEXT;
  v_requester_name TEXT;
  v_owner_name TEXT;
BEGIN
  -- Get book title and user names
  SELECT b.title, p1.full_name, p2.full_name
  INTO v_book_title, v_requester_name, v_owner_name
  FROM books b
  LEFT JOIN profiles p1 ON p1.id = NEW.requester_user_id
  LEFT JOIN profiles p2 ON p2.id = NEW.owner_user_id
  WHERE b.id = NEW.book_id;

  -- New request notification for owner
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM create_notification(
      NEW.owner_user_id,
      'request_received',
      'New Book Request',
      v_requester_name || ' wants to request "' || v_book_title || '"',
      '/requests',
      jsonb_build_object('request_id', NEW.id, 'book_id', NEW.book_id)
    );
  END IF;

  -- Request accepted notification for requester
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.requester_user_id,
      'request_accepted',
      'Request Accepted!',
      v_owner_name || ' accepted your request for "' || v_book_title || '"',
      '/requests',
      jsonb_build_object('request_id', NEW.id, 'book_id', NEW.book_id)
    );
  END IF;

  -- Request rejected notification for requester
  IF TG_OP = 'UPDATE' AND NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.requester_user_id,
      'request_rejected',
      'Request Declined',
      'Your request for "' || v_book_title || '" was declined',
      '/matches',
      jsonb_build_object('request_id', NEW.id, 'book_id', NEW.book_id)
    );
  END IF;

  -- Swap completed notification for both users
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status = 'accepted' THEN
    PERFORM create_notification(
      NEW.owner_user_id,
      'request_completed',
      'Exchange Completed',
      'You completed an exchange with ' || v_requester_name || ' for "' || v_book_title || '"',
      '/history',
      jsonb_build_object('request_id', NEW.id, 'book_id', NEW.book_id)
    );
    
    PERFORM create_notification(
      NEW.requester_user_id,
      'request_completed',
      'Exchange Completed',
      'You completed an exchange with ' || v_owner_name || ' for "' || v_book_title || '"',
      '/history',
      jsonb_build_object('request_id', NEW.id, 'book_id', NEW.book_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for request notifications
CREATE TRIGGER on_request_notification
  AFTER INSERT OR UPDATE OF status ON public.book_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_request_status_change();

-- Add index for better performance
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);