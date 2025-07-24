import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'; // Card is imported but not used
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // Supabase is imported but not directly used in the provided code
import { Copy, Users, Lock, CheckCircle, Crown, Sparkles, Gift, MessageCircle, FileText, Package, Percent, Calendar, Star } from 'lucide-react';
import { Mixpanel } from '@/lib/mixpanel';
import * as THREE from 'three';

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
    title: "1 Referido",
    description: "20 Prompts Esenciales PDF",
    icon: FileText
  },
  {
    id: 2,
    threshold: 4,
    title: "4 Referidos",
    description: "1 Sesión grabada con caso de uso real",
    icon: Package
  },
  {
    id: 3,
    threshold: 7,
    title: "7 Referidos",
    description: "50% Descuento Primer Mes",
    icon: Percent
  },
  {
    id: 4,
    threshold: 12,
    title: "12 Referidos",
    description: "3 meses GRATIS",
    icon: Calendar
  }
];

const ReferralDashboard = () => {
  const [searchParams] = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);

  const referralCode = searchParams.get('code');
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  // Three.js background effect
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    sceneRef.current = { scene, camera, renderer };

    const particleCount = 150;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 60;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;

      const color = new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.8, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    camera.position.set(0, 0, 20);

    const mouse = new THREE.Vector2();
    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time * 0.5 + positions[i] * 0.02) * 0.02;
        positions[i] += Math.cos(time * 0.3 + positions[i + 1] * 0.02) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += 0.001;

      camera.position.x += (mouse.x * 1 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 1 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

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
      
      // Identify user in Mixpanel and track dashboard view
      if (data && data.email) {
        Mixpanel.identify(data.email);
        Mixpanel.people.set({
          $email: data.email,
          referral_count: data.referral_count
        });
        
        // Track dashboard view
        Mixpanel.track('Viewed Referral Dashboard', {
          referralCode: referralCode 
        });
      }
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
      
      // Track referral link copy in Mixpanel
      Mixpanel.track('Referral Link Copied', {
        referralCode: referralCode
      });
      
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

  const getProgressPercentage = (threshold: number) => {
    if (!userData) return 0;
    return Math.min((userData.referral_count / threshold) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 w-20 h-20 bg-purple-400/30 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-20 h-20 border-4 border-purple-300/30 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-white text-lg font-semibold drop-shadow-lg">Cargando tu dashboard...</p>
            <p className="text-purple-200 text-sm">Preparando algo increíble para ti</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518] flex items-center justify-center p-4">
        <div className="p-8 text-center bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl shadow-2xl max-w-md">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-16 h-16 bg-purple-400/30 rounded-full blur-xl"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Usuario no encontrado</h1>
          <p className="text-purple-200">El código de referencia no es válido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518] relative overflow-hidden">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-5">
        <div className="absolute top-[10%] left-[8%] w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg rotate-12 shadow-lg animate-float">
          <Gift className="w-4 h-4 text-white m-2" />
        </div>

        <div className="absolute top-[15%] right-[12%] w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg animate-float-delayed">
          <Users className="w-5 h-5 text-white m-2.5" />
        </div>

        <div className="absolute bottom-[25%] left-[6%] w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl rotate-45 shadow-lg animate-float">
          <Sparkles className="w-4 h-4 text-white m-2.5 -rotate-45" />
        </div>

        <div className="absolute top-[40%] right-[5%] w-7 h-7 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full shadow-lg animate-float-delayed">
          <Crown className="w-3 h-3 text-white m-2" />
        </div>

        <div className="absolute bottom-[15%] right-[15%] w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg -rotate-12 shadow-lg animate-float">
          <Star className="w-4 h-4 text-white m-2" />
        </div>

        <div className="absolute top-[60%] left-[12%] w-6 h-6 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-lg animate-float-delayed">
          <CheckCircle className="w-3 h-3 text-white m-1.5" />
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <div className="absolute bottom-6 right-6 z-20">
        <a
          href="https://chat.whatsapp.com/JMSMme18JN9B6zHdRC6ZGg"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => Mixpanel.track('Clicked WhatsApp CTA', { referralCode: referralCode })}
          className="group relative flex items-center bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {/* Tooltip */}
          <div className="absolute right-full mr-3 bg-purple-900/90 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-purple-400/30">
            No te pierdas las novedades!!
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-purple-900/90 rotate-45 transform -translate-y-1/2"></div>
          </div>

          {/* Button Content */}
          <div className="flex items-center px-4 py-3">
            {/* WhatsApp Icon SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="flex-shrink-0"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.707"/>
            </svg>
            <span className="ml-2 text-sm font-medium hidden lg:block">Únete a la comunidad</span>
          </div>
        </a>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto space-y-8 py-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center bg-purple-500/20 backdrop-blur-xl border border-purple-400/40 rounded-full px-6 py-3 shadow-lg mb-4">
              <Crown className="w-5 h-5 mr-3 text-purple-300" />
              <span className="text-purple-200 text-sm font-medium tracking-wide">AI Academy Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl leading-tight tracking-tight">
              {getPersonalizedGreeting()}
            </h1>
            <p className="text-xl lg:text-2xl text-purple-100 drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
              Comparte tu enlace mágico y <span className="text-purple-200 font-semibold">desbloquea recompensas increíbles</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="relative mb-4">
                <div className="absolute inset-0 w-20 h-20 bg-purple-500/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{userData.referral_count}</h3>
              <p className="text-purple-200 font-medium">Amigos Invitados</p>
            </div>

            <div className="group bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="relative mb-4">
                <div className="absolute inset-0 w-20 h-20 bg-purple-400/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300">
                  <Gift className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {rewards.filter(r => isRewardUnlocked(r.threshold)).length}
              </h3>
              <p className="text-purple-200 font-medium">Recompensas Desbloqueadas</p>
            </div>

            <div className="group bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="relative mb-4">
                <div className="absolute inset-0 w-20 h-20 bg-purple-600/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300">
                  <Crown className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">VIP</h3>
              <p className="text-purple-200 font-medium">Status en el Club</p>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6 flex items-center drop-shadow-lg">
              <Sparkles className="w-7 h-7 mr-3 text-purple-300" />
              Tu Enlace Mágico
            </h2>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 p-6 bg-purple-800/30 backdrop-blur-sm rounded-xl font-mono text-sm lg:text-base text-purple-100 border border-purple-500/30 shadow-xl overflow-hidden">
                <div className="truncate">{referralLink}</div>
              </div>
              <Button
                onClick={copyToClipboard}
                className={`px-8 py-6 text-base transition-all duration-300 font-semibold shadow-2xl ${
                  copySuccess
                    ? 'bg-green-600 hover:bg-green-600'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 hover:scale-105 hover:shadow-purple-500/30'
                }`}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copiar Enlace
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-8 flex items-center drop-shadow-lg">
              <Gift className="w-7 h-7 mr-3 text-purple-300" />
              Recompensas Exclusivas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewards.map((reward) => {
                const isUnlocked = isRewardUnlocked(reward.threshold);
                const IconComponent = reward.icon;
                const progress = getProgressPercentage(reward.threshold);

                return (
                  <div
                    key={reward.id}
                    className={`group relative p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm hover:scale-105 ${
                      isUnlocked
                        ? 'bg-purple-600/20 border-purple-400/60 shadow-lg shadow-purple-500/20'
                        : 'bg-purple-900/20 border-purple-600/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-center space-y-4">
                      <div className="relative">
                        {isUnlocked && (
                          <div className="absolute inset-0 w-16 h-16 bg-purple-400/30 rounded-full blur-lg mx-auto"></div>
                        )}
                        <div
                          className={`relative w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg transition-all duration-300 ${
                            isUnlocked
                              ? 'bg-gradient-to-br from-purple-400 to-purple-500 group-hover:shadow-purple-400/50'
                              : 'bg-purple-800/50 group-hover:bg-purple-800/70'
                          }`}
                        >
                          {isUnlocked ? (
                            <CheckCircle className="w-8 h-8 text-white" />
                          ) : (
                            <IconComponent className="w-8 h-8 text-purple-300" />
                          )}
                        </div>
                      </div>

                      <div>
                        <h3
                          className={`text-lg font-bold drop-shadow-lg ${
                            isUnlocked ? 'text-white' : 'text-purple-200'
                          }`}
                        >
                          {reward.title}
                        </h3>
                        <p
                          className={`text-sm ${
                            isUnlocked ? 'text-purple-100' : 'text-purple-300'
                          }`}
                        >
                          {reward.description}
                        </p>
                      </div>

                      {!isUnlocked && (
                        <div className="space-y-3">
                          <div className="w-full bg-purple-800/30 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-purple-400 to-purple-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-purple-300 font-medium">
                            {userData.referral_count}/{reward.threshold} referidos
                          </div>
                        </div>
                      )}

                      <div
                        className={`text-sm font-semibold ${
                          isUnlocked ? 'text-purple-300' : 'text-purple-400'
                        }`}
                      >
                        {isUnlocked ? '¡Desbloqueado!' : `${reward.threshold} referido${reward.threshold > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

export default ReferralDashboard;