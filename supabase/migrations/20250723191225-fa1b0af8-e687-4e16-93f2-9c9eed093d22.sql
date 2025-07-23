-- Create referrals table for viral campaign
CREATE TABLE public.referrals (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by_code TEXT,
  referral_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access for this viral campaign
CREATE POLICY "Allow public read access to referrals" 
ON public.referrals 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for new referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for referral counts" 
ON public.referrals 
FOR UPDATE 
USING (true);