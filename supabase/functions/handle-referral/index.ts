import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
      // User already exists, return success without sending another email
      console.log('User already exists:', existingUser.referral_code);
      return new Response(JSON.stringify({ 
        success: true,
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

    // Send welcome email for new users
    try {
      const dashboardUrl = `https://17cea61d-d3dc-45e7-a19d-7712f98c1277.lovableproject.com/referrals?code=${newUser.referral_code}`;
      const referralUrl = `https://17cea61d-d3dc-45e7-a19d-7712f98c1277.lovableproject.com/?ref=${newUser.referral_code}`;

      console.log('Attempting to send email to:', email);
      console.log('Using domain:', Deno.env.get('DOMAIN'));

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>¡Bienvenido a AI Academy!</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #1A103C; font-family: 'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1A103C; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 10px rgba(147, 51, 234, 0.3);">
                ¡Bienvenido al Círculo Interno! 👑
              </h1>
            </div>

            <!-- Main Content -->
            <div style="background: rgba(147, 51, 234, 0.1); border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 16px; padding: 32px; margin-bottom: 32px;">
              
              <p style="color: #FFFFFF; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
                ¡Felicidades! Ya formas parte de la comunidad más exclusiva de creadores con IA.
              </p>

              <p style="color: #E5E7EB; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Tu dashboard personal está listo. Desde ahí podrás invitar amigos, desbloquear recompensas increíbles y acceder a contenido exclusivo.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #10B981; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                  🚀 Acceder a Mi Dashboard
                </a>
              </div>

              <div style="background: rgba(93, 63, 211, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #FFFFFF; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
                  Tu Enlace de Referidos:
                </p>
                <p style="color: #5D3FD3; font-size: 14px; word-break: break-all; margin: 0; background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; font-family: monospace;">
                  ${referralUrl}
                </p>
              </div>

            </div>

            <!-- Contact Info -->
            <div style="text-align: center; border-top: 1px solid rgba(147, 51, 234, 0.3); padding-top: 24px;">
              <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 8px 0;">
                ¿Necesitas ayuda? Contáctanos por WhatsApp
              </p>
              <a href="https://wa.me/573183351733" style="color: #10B981; text-decoration: none; font-weight: 600;">
                +57 318 335 1733
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">
                Este correo fue enviado porque te registraste en AI Academy.<br>
                Nos enfocamos en contenido de valor, sin spam.
              </p>
            </div>

          </div>
        </body>
        </html>
      `;

      // Try sending with verified domain first, fallback to sandbox if not verified
      const domain = Deno.env.get('DOMAIN') || 'updates.stayirrelevant.com';
      const fromAddress = `AI Academy <hola@${domain}>`;
      
      console.log('Sending email with from address:', fromAddress);

      const emailResult = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: '¡Bienvenido al Círculo Interno de AI Academy! 👑',
        html: emailHtml,
      });

      if (emailResult.error) {
        console.error('Resend API error:', emailResult.error);
        console.error('Error details:', JSON.stringify(emailResult.error, null, 2));
        
        // If domain verification error, try with sandbox domain
        if (emailResult.error.message?.includes('domain') || emailResult.error.message?.includes('verification')) {
          console.log('Domain verification issue, trying with sandbox domain...');
          
          const sandboxResult = await resend.emails.send({
            from: 'AI Academy <onboarding@resend.dev>',
            to: [email],
            subject: '¡Bienvenido al Círculo Interno de AI Academy! 👑',
            html: emailHtml,
          });
          
          if (sandboxResult.error) {
            console.error('Sandbox email also failed:', sandboxResult.error);
            throw new Error(`Email sending failed: ${sandboxResult.error.message}`);
          } else {
            console.log('Email sent successfully with sandbox domain:', sandboxResult.data);
          }
        } else {
          throw new Error(`Email sending failed: ${emailResult.error.message}`);
        }
      } else {
        console.log('Email sent successfully with custom domain:', emailResult.data);
      }

    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      console.error('Email error stack:', emailError.stack);
      // Don't fail the whole operation if email fails, but log the error
      return new Response(JSON.stringify({ 
        success: true,
        isNew: true,
        emailError: emailError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
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