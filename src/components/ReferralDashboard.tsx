import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Users, Lock, CheckCircle, Crown, Sparkles, Gift, MessageCircle, FileText, Package, Percent, Calendar } from 'lucide-react';
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
    title: "20 Prompts Esenciales",
    description: "PDF con los prompts más efectivos",
    icon: FileText
  },
  {
    id: 2,
    threshold: 3,
    title: "Stack de Herramientas",
    description: "Herramientas exclusivas por correo",
    icon: Package
  },
  {
    id: 3,
    threshold: 5,
    title: "30% de Descuento",
    description: "En toda la AI Academy",
    icon: Percent
  },
  {
    id: 4,
    threshold: 12,
    title: "1 Año GRATIS",
    description: "Acceso completo sin costo",
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

  // Three.js background effect - Similar al LandingPage
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

    // Particle system mejorado
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
        positions[i + 1] += Math.sin(time * 0.5 + positions[i] * 0.01) * 0.02;
        positions[i] += Math.cos(time * 0.3 + positions[i + 1] * 0.01) * 0.01;
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

  const getProgressPercentage = (threshold: number) => {
    if (!userData) return 0;
    return Math.min((userData.referral_count / threshold) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-300/30 rounded-full animate-spin mx-auto"></div>
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
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
      
      {/* Floating Icons - Igual que LandingPage */}
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
          <MessageCircle className="w-4 h-4 text-white m-2" />
        </div>
      </div>
      
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto space-y-8 py-8">
          {/* Header mejorado */}
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

          {/* Stats Cards mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{userData.referral_count}</h3>
              <p className="text-purple-200 font-medium">Amigos Invitados</p>
            </div>
            
            <div className="group bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {rewards.filter(r => isRewardUnlocked(r.threshold)).length}
              </h3>
              <p className="text-purple-200 font-medium">Recompensas Desbloqueadas</p>
            </div>

            <div className="group bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">VIP</h3>
              <p className="text-purple-200 font-medium">Estado del Miembro</p>
            </div>
          </div>

          {/* Referral Link mejorado */}
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

          {/* Rewards mejoradas */}
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
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg transition-all duration-300 ${
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
                            {userData.referral_count}/{reward.threshold} amigos
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

          {/* WhatsApp CTA mejorado */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 lg:p-12 text-center shadow-2xl hover:shadow-purple-500/30 transition-all duration-300">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-lg">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                ¡Únete al Grupo Exclusivo!
              </h2>
              <p className="text-purple-100 max-w-md mx-auto text-lg leading-relaxed">
                Conecta con otros emprendedores, comparte ideas y accede a contenido exclusivo en nuestro grupo de WhatsApp.
              </p>
              <Button 
                asChild
                className="bg-white text-purple-700 hover:bg-purple-50 font-semibold px-10 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
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
          </div>
        </div>
      </div>

      {/* CSS personalizado */}
      <style jsx>{`
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