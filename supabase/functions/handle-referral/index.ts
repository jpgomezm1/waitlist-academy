import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, referrer_code } = await req.json();

    console.log('Processing referral:', { email, referrer_code });

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('referrals')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      throw checkError;
    }

    if (existingUser) {
      // User already exists, return their existing code
      console.log('User already exists:', existingUser.referral_code);
      return new Response(JSON.stringify({ 
        referral_code: existingUser.referral_code,
        isNew: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique referral code
    const generateCode = () => {
      const name = email.split('@')[0].toUpperCase();
      const random = Math.floor(1000 + Math.random() * 9000);
      return `${name.substring(0, 4)}${random}`;
    };

    let referral_code = generateCode();
    let attempts = 0;

    // Ensure uniqueness
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referral_code', referral_code)
        .maybeSingle();

      if (!existing) break;
      
      referral_code = generateCode();
      attempts++;
    }

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('referrals')
      .insert({
        email,
        referral_code,
        referred_by_code: referrer_code || null,
        referral_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting new user:', insertError);
      throw insertError;
    }

    // If user was referred, increment referrer's count
    if (referrer_code) {
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ 
          referral_count: supabase.sql`referral_count + 1` 
        })
        .eq('referral_code', referrer_code);

      if (updateError) {
        console.error('Error updating referrer count:', updateError);
        // Don't fail the whole operation if this fails
      } else {
        console.log('Updated referrer count for:', referrer_code);
      }
    }

    console.log('New user created:', newUser.referral_code);

    return new Response(JSON.stringify({ 
      referral_code: newUser.referral_code,
      isNew: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in handle-referral function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});