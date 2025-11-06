-- Create book_requests table
CREATE TABLE public.book_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, requester_user_id)
);

-- Enable RLS
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_requests
CREATE POLICY "Users can view their own requests (as requester)"
  ON public.book_requests
  FOR SELECT
  USING (auth.uid() = requester_user_id);

CREATE POLICY "Users can view requests for their books (as owner)"
  ON public.book_requests
  FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create requests"
  ON public.book_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = requester_user_id 
    AND requester_user_id != owner_user_id
  );

CREATE POLICY "Requesters can cancel their own requests"
  ON public.book_requests
  FOR UPDATE
  USING (auth.uid() = requester_user_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Owners can update request status"
  ON public.book_requests
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_book_requests_updated_at
  BEFORE UPDATE ON public.book_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user can request a book
CREATE OR REPLACE FUNCTION public.can_request_book(p_book_id TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_existing_request_count INT;
BEGIN
  -- Get book owner
  SELECT owner_user_id INTO v_owner_id
  FROM books
  WHERE id = p_book_id;
  
  -- Can't request your own book
  IF v_owner_id = p_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check for existing pending requests
  SELECT COUNT(*) INTO v_existing_request_count
  FROM book_requests
  WHERE book_id = p_book_id 
    AND requester_user_id = p_user_id
    AND status = 'pending';
  
  IF v_existing_request_count > 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;