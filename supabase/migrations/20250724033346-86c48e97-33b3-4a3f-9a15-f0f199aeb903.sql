-- Create PostgreSQL function to safely increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count(user_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.referrals
  SET referral_count = referral_count + 1
  WHERE referral_code = user_code;
END;
$$ LANGUAGE plpgsql;