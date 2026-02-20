
-- Drop the broken restrictive false policy
DROP POLICY IF EXISTS "Service role only" ON public.user_rate_limits;

-- Allow service role full access for rate limiting management
CREATE POLICY "Service role full access"
ON public.user_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
