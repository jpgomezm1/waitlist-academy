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
        console.error('Error incrementing referral count via RPC:', rpcError);
      } else {
        console.log('Successfully called increment for:', referrer_code);
        
        // Send notification email to referrer about their new referral
        try {
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

          const rewards = [
            { threshold: 1, name: "20 Prompts Esenciales PDF" },
            { threshold: 4, name: "1 Sesión grabada con caso de uso real" },
            { threshold: 7, name: "50% Descuento Primer Mes" },
            { threshold: 12, name: "3 meses GRATIS" }
          ];

          let nextReward = null;
          for (const reward of rewards) {
            if (referrer.referral_count < reward.threshold) {
              nextReward = reward;
              break;
            }
          }

          if (nextReward) {
            const referralsNeeded = nextReward.threshold - referrer.referral_count;
            const dashboardUrl = `https://17cea61d-d3dc-45e7-a19d-7712f98c1277.lovableproject.com/referrals?code=${referrer_code}`;

            // EMAIL OPTIMIZADO PARA NOTIFICACION DE REFERIDO
            const notificationEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Nuevo referido registrado</title>
              <style>
                /* Estilos básicos compatibles con Outlook */
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: Arial, sans-serif; 
                  background-color: #f5f5f5; 
                  color: #333333;
                }
                .container { 
                  max-width: 600px; 
                  margin: 20px auto; 
                  background-color: #ffffff; 
                  padding: 30px;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #e0e0e0; 
                  padding-bottom: 20px;
                }
                .content { 
                  line-height: 1.6; 
                  margin-bottom: 25px;
                }
                .highlight { 
                  background-color: #f0f8ff; 
                  padding: 15px; 
                  border-left: 4px solid #007cba; 
                  margin: 20px 0;
                }
                .button { 
                  display: inline-block; 
                  background-color: #007cba; 
                  color: #ffffff; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 4px; 
                  margin: 15px 0;
                }
                .footer { 
                  border-top: 1px solid #e0e0e0; 
                  padding-top: 20px; 
                  font-size: 14px; 
                  color: #666666;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="color: #333333; margin: 0;">AI Academy</h1>
                  <p style="margin: 10px 0 0 0; color: #666666;">Actualización de tu programa de referidos</p>
                </div>
                
                <div class="content">
                  <p>Hola,</p>
                  
                  <p>Te escribimos para informarte que alguien más se ha registrado usando tu enlace de referido.</p>
                  
                  <div class="highlight">
                    <p><strong>Progreso actual:</strong> ${referrer.referral_count} referido${referrer.referral_count === 1 ? '' : 's'}</p>
                    <p><strong>Próxima recompensa:</strong> ${nextReward.name}</p>
                    <p><strong>Te faltan:</strong> ${referralsNeeded} referido${referralsNeeded === 1 ? '' : 's'} más</p>
                  </div>
                  
                  <p>Sigue compartiendo tu enlace para desbloquear más beneficios.</p>
                  
                  <p style="text-align: center;">
                    <a href="${dashboardUrl}" class="button">Ver mi progreso</a>
                  </p>
                </div>
                
                <div class="footer">
                  <p>¿Tienes preguntas? Contáctanos por WhatsApp: +57 318 335 1733</p>
                  <p>Este correo se envió porque formas parte del programa de referidos de AI Academy.</p>
                </div>
              </div>
            </body>
            </html>
            `;

            console.log('Sending referral notification email to:', referrer.email);

            const emailResult = await resend.emails.send({
              from: `AI Academy <academy@${Deno.env.get('DOMAIN') || 'updates.stayirrelevant.com'}>`,
              to: [referrer.email],
              subject: 'Nuevo referido registrado - AI Academy',
              html: notificationEmailHtml,
              // Headers para evitar carpeta de promociones
              headers: {
                'X-Entity-Type': 'personal',
                'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
              }
            });

            if (emailResult.error) {
              console.error('Resend API error for notification:', emailResult.error);
            } else {
              console.log('Referral notification email sent successfully:', emailResult.data);
            }
          }

        } catch (notificationError) {
          console.error('Failed to send referral notification email. Error:', notificationError);
        }
      }
    }

    console.log('New user created:', newUser.referral_code);

    // EMAIL OPTIMIZADO PARA BIENVENIDA
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
        <title>Bienvenido a AI Academy</title>
        <style>
          /* Estilos básicos compatibles con Outlook */
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
            background-color: #f5f5f5; 
            color: #333333;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            padding: 30px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #e0e0e0; 
            padding-bottom: 20px;
          }
          .content { 
            line-height: 1.6; 
            margin-bottom: 25px;
          }
          .highlight { 
            background-color: #f0f8ff; 
            padding: 15px; 
            border-left: 4px solid #007cba; 
            margin: 20px 0;
          }
          .rewards-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
          }
          .rewards-table th, .rewards-table td { 
            padding: 10px; 
            border: 1px solid #ddd; 
            text-align: left;
          }
          .rewards-table th { 
            background-color: #f8f9fa;
          }
          .button { 
            display: inline-block; 
            background-color: #007cba; 
            color: #ffffff; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 15px 5px;
          }
          .link-box { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border: 1px solid #dee2e6; 
            word-break: break-all; 
            font-family: monospace;
          }
          .footer { 
            border-top: 1px solid #e0e0e0; 
            padding-top: 20px; 
            font-size: 14px; 
            color: #666666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #333333; margin: 0;">AI Academy</h1>
            <p style="margin: 10px 0 0 0; color: #666666;">Bienvenido a nuestra waitlist exclusiva</p>
          </div>
          
          <div class="content">
            <p>Hola,</p>
            
            <p>¡Felicidades! Ya formas parte de la waitlist exclusiva de AI Academy.</p>
            
            <div class="highlight">
              <p><strong>¿Qué significa esto?</strong></p>
              <p>• Serás de los primeros en acceder cuando abramos las puertas</p>
              <p>• Tendrás beneficios que otros no tendrán</p>
              <p>• Te mantendremos informado sobre el progreso del curso</p>
            </div>
            
            <h2 style="color: #333333;">Sistema de Referidos</h2>
            <p>Como miembro de la waitlist, tienes acceso a nuestro sistema de recompensas. Invita amigos y desbloquea beneficios.</p>
            
            <h3 style="color: #333333;">Recompensas disponibles:</h3>
            <table class="rewards-table">
              <tr>
                <th>Referidos</th>
                <th>Recompensa</th>
              </tr>
              <tr>
                <td>1 referido</td>
                <td>20 Prompts Esenciales PDF</td>
              </tr>
              <tr>
                <td>4 referidos</td>
                <td>1 Sesión grabada con caso de uso real</td>
              </tr>
              <tr>
                <td>7 referidos</td>
                <td>50% Descuento Primer Mes</td>
              </tr>
              <tr>
                <td>12 referidos</td>
                <td>3 meses GRATIS</td>
              </tr>
            </table>
            
            <h3 style="color: #333333;">Tu enlace de referidos:</h3>
            <div class="link-box">
              ${referralUrl}
            </div>
            
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Ver mi dashboard</a>
              <a href="https://chat.whatsapp.com/JMSMme18JN9B6zHdRC6ZGg" class="button">Unirse al grupo</a>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>¿Tienes preguntas?</strong><br>
            Contáctanos por WhatsApp: +57 318 335 1733</p>
            
            <p>Te registraste en la waitlist de AI Academy. Te enviaremos actualizaciones sobre el curso.<br>
            Solo contenido de valor, sin spam.</p>
          </div>
        </div>
      </body>
      </html>
      `;

      const domain = Deno.env.get('DOMAIN') || 'updates.stayirrelevant.com';
      const fromAddress = `AI Academy <academy@${domain}>`;
      
      console.log('Sending email with from address:', fromAddress);

      const emailResult = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: 'Confirmación de registro - AI Academy',
        html: emailHtml,
        // Headers para evitar carpeta de promociones
        headers: {
          'X-Entity-Type': 'personal',
          'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
        }
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
            subject: 'Confirmación de registro - AI Academy',
            html: emailHtml,
            headers: {
              'X-Entity-Type': 'personal',
              'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
            }
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