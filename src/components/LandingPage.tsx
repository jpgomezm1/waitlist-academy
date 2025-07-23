import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Users, Crown } from 'lucide-react';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referrer_code', refCode);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const referrer_code = localStorage.getItem('referrer_code');
      
      const { data, error } = await supabase.functions.invoke('handle-referral', {
        body: {
          email: email.trim(),
          referrer_code
        }
      });

      if (error) throw error;

      // Clear the referrer code from localStorage
      localStorage.removeItem('referrer_code');

      // Redirect to referral dashboard
      navigate(`/referrals?code=${data.referral_code}`);

      toast({
        title: data.isNew ? "¡Bienvenido al Círculo Interno!" : "¡Te damos la bienvenida de vuelta!",
        description: data.isNew ? "Tu enlace mágico está listo" : "Accede a tu dashboard personal",
      });

    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: "Error",
        description: "Hubo un problema. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Hero Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center shadow-glow">
              <Crown className="w-12 h-12 text-foreground" />
            </div>
            <Sparkles className="w-6 h-6 text-accent absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Deja de Usar IA.{' '}
            <span className="text-accent">Empieza a Crear</span>{' '}
            con IA.
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-xl mx-auto leading-relaxed">
            Únete al <strong className="text-accent">Círculo Interno de Fundadores</strong> y 
            desbloquea recompensas exclusivas invitando a tus amigos.
          </p>
        </div>

        {/* Rewards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-lg p-4">
            <Users className="w-8 h-8 text-accent mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground">1 Amigo</h3>
            <p className="text-sm text-foreground/70">Descuento 10%</p>
          </div>
          <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-lg p-4">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground">5 Amigos</h3>
            <p className="text-sm text-foreground/70">Masterclass Exclusiva</p>
          </div>
          <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-lg p-4">
            <Crown className="w-8 h-8 text-accent mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground">10 Amigos</h3>
            <p className="text-sm text-foreground/70">1 Mes Gratis</p>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-lg bg-secondary/50 border-accent/30 focus:border-accent text-foreground placeholder:text-foreground/50"
            required
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-gradient-cta hover:scale-105 transition-all duration-300 shadow-glow"
          >
            {isLoading ? 'Procesando...' : 'Unirme al Círculo Interno'}
          </Button>
        </form>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-6 text-foreground/60 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>100% Gratis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Sin Spam</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Comunidad Exclusiva</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;