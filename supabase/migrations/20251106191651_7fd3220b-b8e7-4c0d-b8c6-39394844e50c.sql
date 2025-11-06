-- Create visualization_events table to store all DSA operations for replay
CREATE TABLE visualization_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  data_structure TEXT NOT NULL,
  events JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE visualization_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view visualization events (public showcase)
CREATE POLICY "Anyone can view visualization events"
  ON visualization_events FOR SELECT
  USING (true);

-- Users can insert their own events
CREATE POLICY "Users can insert own visualization events"
  ON visualization_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live visualization sync
ALTER PUBLICATION supabase_realtime ADD TABLE visualization_events;

-- Create request_queues table for queue-based request management
CREATE TABLE request_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  queue_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE request_queues ENABLE ROW LEVEL SECURITY;

-- Anyone can view request queues
CREATE POLICY "Anyone can view request queues"
  ON request_queues FOR SELECT
  USING (true);

-- Authenticated users can insert/update request queues
CREATE POLICY "Authenticated users can manage request queues"
  ON request_queues FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_visualization_events_user_id ON visualization_events(user_id);
CREATE INDEX idx_visualization_events_created_at ON visualization_events(created_at DESC);
CREATE INDEX idx_visualization_events_data_structure ON visualization_events(data_structure);
CREATE INDEX idx_request_queues_book_id ON request_queues(book_id);

-- Add trigger for updated_at on request_queues
CREATE TRIGGER update_request_queues_updated_at
  BEFORE UPDATE ON request_queues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();