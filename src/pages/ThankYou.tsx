import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Sparkles, Crown, Brain } from 'lucide-react';
import * as THREE from 'three';

const ThankYou = () => {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);

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
    const particleCount = 100;
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

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518]">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      
      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-5">
        <div className="absolute top-[15%] left-[10%] w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg rotate-12 shadow-lg animate-float">
          <Crown className="w-4 h-4 text-white m-2" />
        </div>
        
        <div className="absolute top-[20%] right-[15%] w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg animate-float-delayed">
          <Brain className="w-5 h-5 text-white m-2.5" />
        </div>
        
        <div className="absolute bottom-[20%] left-[8%] w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl rotate-45 shadow-lg animate-float">
          <Mail className="w-4 h-4 text-white m-2.5 -rotate-45" />
        </div>
        
        <div className="absolute top-[35%] right-[8%] w-7 h-7 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full shadow-lg animate-float-delayed">
          <Sparkles className="w-3 h-3 text-white m-2" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            
            {/* Header Badge */}
            <div className="inline-flex items-center bg-purple-500/20 backdrop-blur-xl border border-purple-400/40 rounded-full px-4 py-2 shadow-lg mb-6">
              <Crown className="w-4 h-4 mr-2 text-purple-300" />
              <span className="text-purple-200 text-sm font-medium">AI Academy</span>
            </div>

            {/* Headlines */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl">
              ¡Un último paso!
            </h1>
            
            <p className="text-xl lg:text-2xl text-purple-100 leading-relaxed drop-shadow-lg font-medium">
              Hemos enviado un correo de bienvenida a tu email.
            </p>

            <p className="text-lg text-purple-200 leading-relaxed max-w-xl mx-auto">
              Por favor, revisa tu bandeja de entrada (y la carpeta de spam, por si acaso) para encontrar el enlace a tu dashboard personal y empezar a referir.
            </p>

            {/* Instructions */}
            <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/30 rounded-2xl p-6 mt-8">
              <div className="space-y-4 text-left">
                <h3 className="text-lg font-semibold text-white text-center mb-4">
                  ¿No encuentras el correo?
                </h3>
                <ul className="space-y-2 text-purple-100">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Revisa tu carpeta de spam o promociones
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Busca un correo de "AI Academy"
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    El asunto incluye "Bienvenido al Círculo Interno"
                  </li>
                </ul>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-6">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
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

export default ThankYou;