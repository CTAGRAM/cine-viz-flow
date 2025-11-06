-- Create swaps table for completed exchanges
CREATE TABLE public.swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.book_requests(id) ON DELETE SET NULL,
  swap_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for swaps
CREATE POLICY "Users can view swaps they participated in"
  ON public.swaps
  FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create swaps for accepted requests"
  ON public.swaps
  FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can update their own swap feedback"
  ON public.swaps
  FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Function to mark book as reserved when request is accepted
CREATE OR REPLACE FUNCTION public.handle_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If request is being accepted, mark book as unavailable (reserved)
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE books
    SET available = false
    WHERE id = NEW.book_id;
    
    -- Reject all other pending requests for this book
    UPDATE book_requests
    SET status = 'rejected'
    WHERE book_id = NEW.book_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  
  -- If request is rejected or cancelled, check if book should be available again
  IF (NEW.status = 'rejected' OR NEW.status = 'cancelled') AND OLD.status = 'pending' THEN
    -- Check if there are any other accepted requests
    IF NOT EXISTS (
      SELECT 1 FROM book_requests 
      WHERE book_id = NEW.book_id 
        AND status = 'accepted'
        AND id != NEW.id
    ) THEN
      UPDATE books
      SET available = true
      WHERE id = NEW.book_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for automatic book reservation
CREATE TRIGGER on_request_status_change
  AFTER UPDATE OF status ON public.book_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_request_accepted();

-- Function to complete a swap
CREATE OR REPLACE FUNCTION public.complete_swap(
  p_request_id UUID,
  p_rating INTEGER DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swap_id UUID;
  v_book_id TEXT;
  v_from_user_id UUID;
  v_to_user_id UUID;
BEGIN
  -- Get request details
  SELECT book_id, owner_user_id, requester_user_id
  INTO v_book_id, v_from_user_id, v_to_user_id
  FROM book_requests
  WHERE id = p_request_id
    AND status = 'accepted'
    AND (owner_user_id = auth.uid() OR requester_user_id = auth.uid());
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not authorized';
  END IF;
  
  -- Create swap record
  INSERT INTO swaps (book_id, from_user_id, to_user_id, request_id, rating, feedback)
  VALUES (v_book_id, v_from_user_id, v_to_user_id, p_request_id, p_rating, p_feedback)
  RETURNING id INTO v_swap_id;
  
  -- Update request status
  UPDATE book_requests
  SET status = 'completed'
  WHERE id = p_request_id;
  
  -- Mark book as unavailable (swapped away)
  UPDATE books
  SET available = false
  WHERE id = v_book_id;
  
  RETURN v_swap_id;
END;
$$;

-- Add index for better performance
CREATE INDEX idx_swaps_users ON public.swaps(from_user_id, to_user_id);
CREATE INDEX idx_swaps_book ON public.swaps(book_id);
CREATE INDEX idx_book_requests_status ON public.book_requests(status);
CREATE INDEX idx_books_available ON public.books(available);