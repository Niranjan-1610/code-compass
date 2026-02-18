
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  user_id UUID PRIMARY KEY,
  request_count INTEGER DEFAULT 0 NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_request TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write rate limits (managed entirely by edge function)
CREATE POLICY "Service role only" ON public.user_rate_limits
  FOR ALL USING (false);
