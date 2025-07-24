import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Crown, ArrowRight, Brain, Code, Zap, Users, X, Clock, Cpu, Bot, Mail, Globe, MessageCircle, BarChart3, ShoppingCart } from 'lucide-react';
import { Mixpanel } from '@/lib/mixpanel';
import * as THREE from 'three';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creatorCount, setCreatorCount] = useState(73);
  const [isCounterVisible, setIsCounterVisible] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [currentExample, setCurrentExample] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const previousCount = useRef(150);
  const clickTimeoutRef = useRef(null);

  // Ejemplos rotativos de herramientas
  const examples = [
    { icon: Bot, text: "Chatbot para tu negocio", time: "2 horas" },
    { icon: Mail, text: "Automatiza email marketing", time: "1 hora" },
    { icon: BarChart3, text: "Dashboard de datos", time: "3 horas" },
    { icon: Globe, text: "App web personalizada", time: "4 horas" },
    { icon: Zap, text: "Herramientas para ser 10X productivo", time: "1 día" },
    { icon: Brain, text: "Fundamentos para dominar IA", time: "2 días" }
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referrer_code', refCode);
    }
    // Track landing page view with referral source
    Mixpanel.track('Viewed Landing Page', {
      referral_source: refCode || 'direct'
    });

    // Show counter after a brief delay
    setTimeout(() => setIsCounterVisible(true), 1000);

    // Simulate creator count increase
    const interval = setInterval(() => {
      setCreatorCount(prev => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1;
        previousCount.current = prev;
        return newCount;
      });
    }, 7000);

    // Rotate examples every 3 seconds
    const exampleInterval = setInterval(() => {
      setCurrentExample(prev => (prev + 1) % examples.length);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(exampleInterval);
    };
  }, []);

  // Easter egg click handler
  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    if (clickCount >= 4) {
      setShowEasterEgg(true);
      setClickCount(0);
      
      Mixpanel.track('Easter Egg Discovered', {
        method: 'logo_clicks'
      });
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 3000);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    sceneRef.current = { scene, camera, renderer };

    // Particle system
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

    // Mouse interaction
    const mouse = new THREE.Vector2();
    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Animate particles
      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time * 0.5 + positions[i] * 0.01) * 0.02;
        positions[i] += Math.cos(time * 0.3 + positions[i + 1] * 0.01) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += 0.001;
      
      // Subtle camera movement
      camera.position.x += (mouse.x * 1 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 1 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
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

  const handleSubmit = async (e) => {
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

      const userEmail = email.trim();
      Mixpanel.alias(userEmail);
      Mixpanel.people.set({ $email: userEmail, signup_date: new Date().toISOString() });
      Mixpanel.track('Waitlist Signup', {
        isNewUser: data.isNew
      });

      localStorage.removeItem('referrer_code');
      navigate(`/thank-you?code=${data.referral_code}`);

      toast({
        title: data.isNew ? "¡Bienvenido al Círculo Interno!" : "¡Te damos la bienvenida de vuelta!",
        description: data.isNew ? "Revisa tu email para acceder" : "Revisa tu email para el enlace",
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
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518]">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      
      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-purple-900/90 backdrop-blur-xl border border-purple-400/50 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in relative overflow-hidden">
            <button
              onClick={() => setShowEasterEgg(false)}
              className="absolute top-4 right-4 p-2 text-purple-300 hover:text-white transition-colors duration-200 hover:bg-purple-700/50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">🤖 Plot Twist!</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mx-auto"></div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-purple-800/40 rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Clock className="w-5 h-5 text-purple-300" />
                    <span className="text-purple-100 font-semibold">Tiempo de desarrollo</span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">&lt; 24 horas</div>
                  <div className="text-purple-200 text-sm">Con pura IA generativa 🚀</div>
                </div>
                
                <p className="text-purple-100 leading-relaxed text-sm">
                  Esta landing page completa fue creada usando IA generativa en menos de 24 horas. 
                  <span className="text-purple-300 font-semibold"> Desde el concepto hasta el código final.</span>
                </p>
                
                <div className="flex items-center justify-center space-x-2 text-purple-300 text-xs">
                  <Brain className="w-4 h-4" />
                  <span>Hecho con Claude, Cursor y mucho café ☕</span>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => setShowEasterEgg(false)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/30 transform hover:scale-105"
                >
                  ¡Increíble! 🤯
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-5">
        <div className="absolute top-[15%] left-[10%] w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg rotate-12 shadow-lg animate-float">
          <Crown className="w-4 h-4 text-white m-2" />
        </div>
        <div className="absolute top-[20%] right-[15%] w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg animate-float-delayed">
          <Brain className="w-5 h-5 text-white m-2.5" />
        </div>
        <div className="absolute bottom-[20%] left-[8%] w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl rotate-45 shadow-lg animate-float">
          <Code className="w-4 h-4 text-white m-2.5 -rotate-45" />
        </div>
        <div className="absolute top-[35%] right-[8%] w-7 h-7 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full shadow-lg animate-float-delayed">
          <Sparkles className="w-3 h-3 text-white m-2" />
        </div>
        <div className="absolute bottom-[30%] right-[12%] w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg -rotate-12 shadow-lg animate-float">
          <Zap className="w-4 h-4 text-white m-2" />
        </div>
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Columna Izquierda - Contenido Principal */}
          <div className="space-y-4">
            
            {/* Header Badge */}
            <div className="inline-flex items-center bg-purple-500/20 backdrop-blur-xl border border-purple-400/40 rounded-full px-4 py-2 shadow-lg">
              <Crown className="w-4 h-4 mr-2 text-purple-300" />
              <span className="text-purple-200 text-sm font-medium">AI Academy</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl">
                Deja de Usar IA.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400">
                  Empieza a Crear
                </span>{' '}
                con IA.
              </h1>
              
              <p className="text-base lg:text-lg text-purple-50 leading-relaxed drop-shadow-lg">
              AI Academy es para los que no quieren quedarse atrás. Aprende a crear herramientas, automatizar procesos y usar IA con intención — sin ser programador.
              </p>
            </div>

            {/* Ejemplo rotativo de herramientas - NUEVO */}
            <div className="bg-purple-900/30 backdrop-blur-xl border border-purple-400/30 rounded-xl p-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    {React.createElement(examples[currentExample].icon, { 
                      className: "w-5 h-5 text-white" 
                    })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {examples[currentExample].text}
                  </p>
                  <p className="text-purple-300 text-sm">
                    En {examples[currentExample].time} • Sin código
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex space-x-1">
                    {examples.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentExample ? 'bg-purple-400' : 'bg-purple-600/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Proceso de 3 pasos - NUEVO */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto">1</div>
                <p className="text-purple-200 text-xs">Describes</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto">2</div>
                <p className="text-purple-200 text-xs">IA programa</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto">3</div>
                <p className="text-purple-200 text-xs">Tienes tu herramienta</p>
              </div>
            </div>

            {/* Compact Animated Badge */}
            <div className={`transition-all duration-1000 ${isCounterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="inline-flex items-center relative overflow-hidden bg-gradient-to-r from-purple-500/15 via-purple-400/20 to-purple-500/15 backdrop-blur-xl border border-purple-300/40 rounded-full px-4 py-2 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/10 to-transparent animate-shimmer"></div>
                
                <div className="relative flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-purple-300 font-medium">LIVE</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-300" />
                    <span className="text-lg font-bold text-white counter-animation">
                      {creatorCount}
                    </span>
                    <span className="text-purple-200 text-sm font-medium">Builders</span>
                  </div>
                  
                  <div className="w-3 h-3 bg-green-400/20 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Author Badge */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 w-10 h-10 rounded-full bg-purple-400/40 blur-lg animate-pulse"></div>
                <div className="absolute inset-0 w-10 h-10 rounded-full bg-purple-300/20 blur-md"></div>
                
                <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-2xl bg-purple-900/50 border-2 border-purple-400/60">
                  <img 
                    src="https://storage.googleapis.com/cluvi/Imagenes/Variaciones%20Mr.%20irrelevant%20(1).PNG" 
                    alt="irrelevant avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm drop-shadow-lg">A course from</span>
                  <img 
                    src="https://storage.googleapis.com/cluvi/nuevo_irre-removebg-preview.png" 
                    alt="irrelevant logo" 
                    className="h-5 w-auto drop-shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
                    onClick={handleLogoClick}
                    title="¿Tienes curiosidad? 🤔"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Formulario */}
          <div className="lg:max-w-lg">
            <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/30 rounded-2xl p-6 lg:p-7 shadow-2xl">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg">
                    Únete a la waitlist
                  </h3>
                  <p className="text-purple-100 text-sm lg:text-base">
                    Acceso anticipado y contenido exclusivo antes del lanzamiento.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base bg-purple-800/40 backdrop-blur-sm border-purple-300/40 focus:border-purple-300 text-white placeholder:text-purple-200 rounded-lg px-4 shadow-xl"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 border-0 rounded-lg transition-all duration-300 shadow-2xl hover:shadow-purple-500/30 font-semibold transform hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Quiero Unirme</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes countUp {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 3s;
        }
        
        .animate-shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }
        
        .counter-animation {
          animation: countUp 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;