import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Users, Lock, CheckCircle, Crown, Sparkles, Gift, MessageCircle } from 'lucide-react';

interface UserData {
  email: string;
  referral_code: string;
  referral_count: number;
  created_at: string;
}

interface Reward {
  id: number;
  threshold: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const rewards: Reward[] = [
  {
    id: 1,
    threshold: 1,
    title: "Descuento 10%",
    description: "En tu primera suscripción",
    icon: Gift
  },
  {
    id: 2,
    threshold: 5,
    title: "Masterclass Exclusiva",
    description: "Sesión privada con fundadores",
    icon: Sparkles
  },
  {
    id: 3,
    threshold: 10,
    title: "1 Mes Gratis",
    description: "Acceso completo sin costo",
    icon: Crown
  }
];

const ReferralDashboard = () => {
  const [searchParams] = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  const referralCode = searchParams.get('code');
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  useEffect(() => {
    if (!referralCode) {
      toast({
        title: "Error",
        description: "Código de referencia no encontrado",
        variant: "destructive",
      });
      return;
    }

    fetchUserData();
  }, [referralCode]);

  const fetchUserData = async () => {
    if (!referralCode) return;

    try {
      // Call the edge function with the referral code as a query parameter
      const response = await fetch(
        `https://qdccqwdrnkuzgqbttlgn.supabase.co/functions/v1/get-referral-data?code=${referralCode}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar tus datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      toast({
        title: "¡Copiado!",
        description: "Enlace copiado al portapapeles",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const getPersonalizedGreeting = () => {
    if (!userData) return "¡Hola!";
    const name = userData.email.split('@')[0];
    return `¡Hola, ${name.charAt(0).toUpperCase() + name.slice(1)}!`;
  };

  const isRewardUnlocked = (threshold: number) => {
    return userData ? userData.referral_count >= threshold : false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-card/20 backdrop-blur-sm border-accent/30">
          <h1 className="text-2xl font-bold text-foreground mb-4">Usuario no encontrado</h1>
          <p className="text-foreground/70">El código de referencia no es válido.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {getPersonalizedGreeting()}
          </h1>
          <p className="text-xl text-foreground/80">
            Comparte tu enlace mágico y desbloquea recompensas increíbles
          </p>
        </div>

        {/* Stats Card */}
        <Card className="p-6 bg-card/20 backdrop-blur-sm border-accent/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">{userData.referral_count}</h3>
              <p className="text-foreground/70">Amigos Invitados</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">
                {rewards.filter(r => isRewardUnlocked(r.threshold)).length}
              </h3>
              <p className="text-foreground/70">Recompensas Desbloqueadas</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">VIP</h3>
              <p className="text-foreground/70">Estado del Miembro</p>
            </div>
          </div>
        </Card>

        {/* Referral Link */}
        <Card className="p-6 bg-card/20 backdrop-blur-sm border-accent/30">
          <h2 className="text-2xl font-bold text-foreground mb-4">Tu Enlace Mágico</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-4 bg-secondary/30 rounded-lg font-mono text-sm text-foreground border border-accent/20">
              {referralLink}
            </div>
            <Button
              onClick={copyToClipboard}
              className={`px-6 transition-all duration-300 ${
                copySuccess 
                  ? 'bg-primary hover:bg-primary' 
                  : 'bg-gradient-cta hover:scale-105'
              }`}
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Enlace
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Rewards */}
        <Card className="p-6 bg-card/20 backdrop-blur-sm border-accent/30">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recompensas Exclusivas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const isUnlocked = isRewardUnlocked(reward.threshold);
              const IconComponent = reward.icon;
              
              return (
                <div
                  key={reward.id}
                  className={`relative p-6 rounded-lg border transition-all duration-300 ${
                    isUnlocked
                      ? 'bg-accent/20 border-accent shadow-glow'
                      : 'bg-muted/10 border-muted-foreground/20'
                  }`}
                >
                  <div className="text-center space-y-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                        isUnlocked ? 'bg-accent' : 'bg-muted'
                      }`}
                    >
                      {isUnlocked ? (
                        <CheckCircle className="w-8 h-8 text-accent-foreground" />
                      ) : (
                        <Lock className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div>
                      <h3
                        className={`text-xl font-bold ${
                          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {reward.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isUnlocked ? 'text-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {reward.description}
                      </p>
                    </div>
                    
                    <div
                      className={`text-sm font-semibold ${
                        isUnlocked ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    >
                      {isUnlocked ? '¡Desbloqueado!' : `${reward.threshold} amigo${reward.threshold > 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* WhatsApp CTA */}
        <Card className="p-8 bg-gradient-cta text-center">
          <div className="space-y-4">
            <MessageCircle className="w-16 h-16 text-primary-foreground mx-auto" />
            <h2 className="text-2xl font-bold text-primary-foreground">
              ¡Únete al Grupo Exclusivo!
            </h2>
            <p className="text-primary-foreground/90 max-w-md mx-auto">
              Conecta con otros fundadores, comparte ideas y accede a contenido exclusivo en nuestro grupo de WhatsApp.
            </p>
            <Button 
              asChild
              className="bg-background text-foreground hover:bg-background/90 font-semibold px-8 py-3"
            >
              <a 
                href="https://chat.whatsapp.com/invite-link" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Únete al Grupo de WhatsApp
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReferralDashboard;