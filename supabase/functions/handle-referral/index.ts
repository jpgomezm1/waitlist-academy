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
        isNew: false,
        referral_code: existingUser.referral_code
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

    // Update referrer's count if they referred someone using RPC for atomicity
    if (referrer_code) {
      console.log('Attempting to increment count for:', referrer_code);
      const { error: rpcError } = await supabase.rpc('increment_referral_count', {
        user_code: referrer_code,
      });

      if (rpcError) {
        // Log the error in detail but do not stop the execution,
        // as creating the new user is the primary goal.
        console.error('Error incrementing referral count via RPC:', rpcError);
      } else {
        console.log('Successfully called increment for:', referrer_code);
        
        // Send notification email to referrer about their new referral
        try {
          // 1. Fetch the referrer's updated data
          const { data: referrer, error: fetchError } = await supabase
            .from('referrals')
            .select('email, referral_count')
            .eq('referral_code', referrer_code)
            .single();

          if (fetchError) throw new Error('Referrer not found after increment.');
          if (!referrer) {
            console.log('Referrer not found, skipping notification email');
            return;
          }

          // 2. Determine the next reward
          const rewards = [
            { threshold: 1, name: "20 Prompts Esenciales PDF" },
            { threshold: 3, name: "Stack de Herramientas Exclusivo" },
            { threshold: 5, name: "30% de Descuento" },
            { threshold: 12, name: "1 Año GRATIS Completo" }
          ];

          let nextReward = null;
          for (const reward of rewards) {
            if (referrer.referral_count < reward.threshold) {
              nextReward = reward;
              break;
            }
          }

          // 3. Send the notification email via Resend
          if (nextReward) {
            const referralsNeeded = nextReward.threshold - referrer.referral_count;
            const dashboardUrl = `https://17cea61d-d3dc-45e7-a19d-7712f98c1277.lovableproject.com/referrals?code=${referrer_code}`;

            const notificationEmailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>¡Nuevo Referido! - AI Academy</title>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                </style>
              </head>
              <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #0f0518 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #ffffff; min-height: 100vh;">
                
                <!-- Main Container -->
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  
                  <!-- Logo Section -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <img src="https://storage.googleapis.com/cluvi/nuevo_irre-removebg-preview.png" alt="irrelevant logo" style="height: 40px; width: auto; filter: drop-shadow(0 4px 8px rgba(147, 51, 234, 0.3));">
                  </div>
                  
                  <!-- Header -->
                  <div style="text-align: center; margin-bottom: 40px;">
                    <!-- Celebration Badge -->
                    <div style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50px; padding: 12px 20px; margin-bottom: 24px;">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">🎉 ¡NUEVO REFERIDO!</span>
                    </div>
                    
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; line-height: 1.2; text-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);">
                      ¡Excelente! Ya tienes ${referrer.referral_count} referido${referrer.referral_count === 1 ? '' : 's'}
                    </h1>
                  </div>

                  <!-- Progress Message -->
                  <div style="background: rgba(147, 51, 234, 0.1); backdrop-filter: blur(20px); border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 20px; padding: 40px; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
                    
                    <p style="color: #ffffff; font-size: 20px; line-height: 1.6; margin: 0 0 24px 0; text-align: center; font-weight: 600;">
                      ¡Alguien más se unió usando tu enlace!
                    </p>

                    <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0; text-align: center;">
                      Vas por un excelente camino. Sigue compartiendo tu enlace para desbloquear recompensas increíbles.
                    </p>

                  </div>

                  <!-- Next Goal Section -->
                  <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 40px; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Goal Badge -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <div style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50px; padding: 12px 20px;">
                        <span style="color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">🎯 PRÓXIMA META</span>
                      </div>
                    </div>

                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                      Te faltan ${referralsNeeded} referido${referralsNeeded === 1 ? '' : 's'} más
                    </h2>

                    <p style="color: #e5e7eb; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                      Para conseguir tu siguiente premio:
                    </p>

                    <!-- Reward Preview -->
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 12px;">🏆</div>
                      <p style="color: #10b981; font-size: 20px; font-weight: 700; margin: 0;">
                        ${nextReward.name}
                      </p>
                    </div>

                    <!-- Dashboard CTA -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); transition: all 0.3s ease; border: none;">
                        📊 Ver mi Progreso
                      </a>
                    </div>

                  </div>

                  <!-- Support Section -->
                  <div style="text-align: center; border-top: 1px solid rgba(147, 51, 234, 0.3); padding-top: 24px; margin-bottom: 24px;">
                    <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px 0;">
                      ¿Tienes preguntas? Estamos aquí para ayudarte
                    </p>
                    <a href="https://wa.link/879mga" style="color: #10b981; text-decoration: none; font-weight: 600; font-size: 14px;">
                      📱 Soporte WhatsApp: +57 318 335 1733
                    </a>
                  </div>

                  <!-- Footer -->
                  <div style="text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
                      Sigues siendo parte de la waitlist de AI Academy. Te avisaremos cuando esté listo.<br>
                      Solo contenido de valor, sin spam.
                    </p>
                  </div>

                </div>
              </body>
              </html>
            `;

            console.log('Sending referral notification email to:', referrer.email);

            const emailResult = await resend.emails.send({
              from: `AI Academy <hola@${Deno.env.get('DOMAIN') || 'updates.stayirrelevant.com'}>`,
              to: [referrer.email],
              subject: '¡Felicidades! Alguien más se unió con tu enlace 🎉',
              html: notificationEmailHtml,
            });

            if (emailResult.error) {
              console.error('Resend API error for notification:', emailResult.error);
            } else {
              console.log('Referral notification email sent successfully:', emailResult.data);
            }
          }

        } catch (notificationError) {
          console.error('Failed to send referral notification email. Error:', notificationError);
          // Continue execution - this is not critical to the main flow
        }
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
          <title>¡Bienvenido a la Waitlist de AI Academy!</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #0f0518 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #ffffff; min-height: 100vh;">
          
          <!-- Main Container -->
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Logo Section -->
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://storage.googleapis.com/cluvi/nuevo_irre-removebg-preview.png" alt="irrelevant logo" style="height: 40px; width: auto; filter: drop-shadow(0 4px 8px rgba(147, 51, 234, 0.3));">
            </div>
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <!-- AI Academy Badge -->
              <div style="display: inline-flex; align-items: center; background: rgba(147, 51, 234, 0.2); border: 1px solid rgba(147, 51, 234, 0.4); border-radius: 50px; padding: 12px 20px; margin-bottom: 24px;">
                <span style="color: #a855f7; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">👑 AI Academy Waitlist</span>
              </div>
              
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; line-height: 1.2; text-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);">
                ¡Bienvenido al Club!
              </h1>
            </div>

            <!-- Welcome Message -->
            <div style="background: rgba(147, 51, 234, 0.1); backdrop-filter: blur(20px); border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 20px; padding: 40px; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
              
              <p style="color: #ffffff; font-size: 20px; line-height: 1.6; margin: 0 0 24px 0; text-align: center; font-weight: 600;">
                ¡Felicidades! Ya formas parte de la waitlist exclusiva de AI Academy.
              </p>

              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Serás de los primeros en acceder cuando abramos las puertas, y tendrás beneficios que otros no tendrán. 
                Te mantendremos informado sobre el progreso del curso y te avisaremos tan pronto esté disponible.
              </p>

              <p style="color: #a855f7; font-size: 16px; line-height: 1.5; margin: 0; text-align: center; font-weight: 500;">
                Mientras tanto, mantente atento a tu email para actualizaciones exclusivas y contenido anticipado. 📧
              </p>

            </div>

            <!-- Surprise Section -->
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 40px; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
              
              <!-- Surprise Badge -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50px; padding: 12px 20px;">
                  <span style="color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">🎁 PRIMERA SORPRESA</span>
                </div>
              </div>

              <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                Sistema de Referidos Exclusivo
              </h2>

              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Como <strong style="color: #10b981;">Early Adopter</strong>, tienes acceso anticipado a nuestro sistema de recompensas. 
                Invita amigos y desbloquea beneficios increíbles antes que nadie.
              </p>

              <!-- How it Works -->
              <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                  ¿Cómo funciona?
                </h3>
                
                <div style="color: #e5e7eb; font-size: 14px; line-height: 1.6;">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="color: #10b981; font-weight: 600; margin-right: 8px;">1.</span>
                    Comparte tu enlace único con amigos interesados en IA
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="color: #10b981; font-weight: 600; margin-right: 8px;">2.</span>
                    Cada amigo que se una usando tu enlace cuenta como referido
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="color: #10b981; font-weight: 600; margin-right: 8px;">3.</span>
                    Desbloquea recompensas automáticamente según tus referidos
                  </div>
                </div>
              </div>

              <!-- Rewards Preview -->
              <div style="background: rgba(139, 92, 246, 0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                  🏆 Recompensas que puedes desbloquear:
                </h3>
                
                <div style="display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">📚</div>
                    <div style="color: #10b981; font-size: 14px; font-weight: 600;">1 Referido</div>
                    <div style="color: #e5e7eb; font-size: 12px;">20 Prompts Esenciales PDF</div>
                  </div>
                  <div style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🛠️</div>
                    <div style="color: #10b981; font-size: 14px; font-weight: 600;">3 Referidos</div>
                    <div style="color: #e5e7eb; font-size: 12px;">Stack de Herramientas Exclusivo</div>
                  </div>
                  <div style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
                    <div style="color: #10b981; font-size: 14px; font-weight: 600;">5 Referidos</div>
                    <div style="color: #e5e7eb; font-size: 12px;">30% de Descuento</div>
                  </div>
                  <div style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">👑</div>
                    <div style="color: #10b981; font-size: 14px; font-weight: 600;">12 Referidos</div>
                    <div style="color: #e5e7eb; font-size: 12px;">1 Año GRATIS Completo</div>
                  </div>
                </div>
              </div>

              <!-- Referral Link -->
              <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
                  🔗 Tu enlace mágico de referidos:
                </p>
                <div style="background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; word-break: break-all; text-align: center;">
                  <p style="color: #a855f7; font-size: 14px; margin: 0; font-family: 'Courier New', monospace;">
                    ${referralUrl}
                  </p>
                </div>
                <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0 0; text-align: center;">
                  Cópialo y compártelo en redes sociales, WhatsApp o donde quieras
                </p>
              </div>

              <!-- Dashboard CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); transition: all 0.3s ease; border: none;">
                  🚀 Ver Mi Dashboard de Referidos
                </a>
              </div>

            </div>

            <!-- WhatsApp Community -->
            <div style="background: linear-gradient(135deg, #25d366 0%, #128c7e 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(37, 211, 102, 0.2);">
              <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
              <h3 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
                Únete a la Comunidad Exclusiva
              </h3>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0 0 20px 0; line-height: 1.5;">
                Conecta con otros Early Adopters, comparte ideas y accede a contenido exclusivo que no encontrarás en ningún otro lugar.
              </p>
              <a href="https://chat.whatsapp.com/JMSMme18JN9B6zHdRC6ZGg" style="display: inline-block; background: rgba(255, 255, 255, 0.2); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; border: 2px solid rgba(255, 255, 255, 0.3); backdrop-filter: blur(10px);">
                📱 Entrar al Grupo de WhatsApp
              </a>
            </div>

            <!-- Support Section -->
            <div style="text-align: center; border-top: 1px solid rgba(147, 51, 234, 0.3); padding-top: 24px; margin-bottom: 24px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px 0;">
                ¿Tienes preguntas? Estamos aquí para ayudarte
              </p>
              <a href="https://wa.link/879mga" style="color: #10b981; text-decoration: none; font-weight: 600; font-size: 14px;">
                📱 Soporte WhatsApp: +57 318 335 1733
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
                Te registraste en la waitlist de AI Academy. Te enviaremos actualizaciones sobre el curso.<br>
                Solo contenido de valor, sin spam. Puedes desuscribirte cuando quieras.
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
        subject: '¡Bienvenido al Club de AI Academy! 🎁',
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
            subject: '¡Bienvenido al Círculo Interno de AI Academy! 🎁',
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
        referral_code: newUser.referral_code,
        emailError: emailError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      isNew: true,
      referral_code: newUser.referral_code
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