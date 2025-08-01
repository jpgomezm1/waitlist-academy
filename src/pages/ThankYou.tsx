import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Sparkles, Crown, CheckCircle, Gift, Users, Zap, Star, Package, ArrowRight } from 'lucide-react';
import { Mixpanel } from '@/lib/mixpanel';
import * as THREE from 'three';

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('code');
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const [showBenefits, setShowBenefits] = useState(false);

  useEffect(() => {
    // Track thank you page view
    Mixpanel.track('Viewed Thank You Page');

    const timer = setTimeout(() => {
      setShowBenefits(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518]">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-20 sm:opacity-30 z-5">
        <div className="absolute top-[15%] left-[10%] w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg rotate-12 shadow-lg animate-float">
          <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-white m-1.5 sm:m-2" />
        </div>

        <div className="absolute top-[20%] right-[15%] w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg animate-float-delayed">
          <Crown className="w-4 sm:w-5 h-4 sm:h-5 text-white m-2 sm:m-2.5" />
        </div>

        <div className="absolute bottom-[20%] left-[8%] w-7 sm:w-9 h-7 sm:h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl rotate-45 shadow-lg animate-float">
          <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-white m-2 sm:m-2.5 -rotate-45" />
        </div>

        <div className="absolute top-[35%] right-[8%] w-5 sm:w-7 h-5 sm:h-7 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full shadow-lg animate-float-delayed">
          <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white m-1.5 sm:m-2" />
        </div>

        <div className="absolute bottom-[25%] right-[12%] w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg -rotate-12 shadow-lg animate-float">
          <Gift className="w-3 sm:w-4 h-3 sm:h-4 text-white m-1.5 sm:m-2" />
        </div>

        <div className="absolute top-[60%] left-[12%] w-5 sm:w-6 h-5 sm:h-6 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-lg animate-float-delayed">
          <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white m-1 sm:m-1.5" />
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
        <a
          href="https://chat.whatsapp.com/JMSMme18JN9B6zHdRC6ZGg"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {/* Tooltip */}
          <div className="absolute right-full mr-3 bg-purple-900/90 backdrop-blur-sm text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-purple-400/30 hidden sm:block">
            No te pierdas las novedades!!
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-purple-900/90 rotate-45 transform -translate-y-1/2"></div>
          </div>

          {/* Button Content */}
          <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3">
            {/* WhatsApp Icon SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="flex-shrink-0 sm:w-6 sm:h-6"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.707" />
            </svg>
            <span className="ml-2 text-xs sm:text-sm font-medium hidden min-[400px]:block lg:block">Únete a la comunidad</span>
          </div>
        </a>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center">

          {/* Columna Izquierda - Confirmación */}
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">

            {/* Success Icon */}
            <div className="flex justify-center lg:justify-start mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 w-16 sm:w-20 h-16 sm:h-20 bg-green-400/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                  <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Header Badge */}
            <div className="inline-flex items-center bg-purple-500/20 backdrop-blur-xl border border-purple-400/40 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
              <Crown className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5 sm:mr-2 text-purple-300" />
              <span className="text-purple-200 text-xs sm:text-sm font-medium">AI Academy Waitlist</span>
            </div>

            {/* Main Headlines */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl">
                ¡Gracias por unirte como{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-200 to-green-400">
                  Early Adopter!
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-purple-100 leading-relaxed drop-shadow-lg max-w-xl mx-auto lg:mx-0">
                Hemos enviado tu enlace de acceso a tu correo. O si lo prefieres, puedes ir directamente a tu dashboard ahora mismo.
              </p>
            </div>

            {/* Dashboard CTA Button */}
            {referralCode && (
              <div className="flex justify-center lg:justify-start mb-4 sm:mb-6">
                <Button asChild className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold text-lg px-8 py-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <Link to={`/referrals?code=${referralCode}`}>
                    <span>Ir a mi Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Email Instructions */}
            <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-xl p-4 sm:p-6 shadow-xl">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <Mail className="w-4 sm:w-5 h-4 sm:h-5 text-purple-300 flex-shrink-0" />
                <h3 className="text-sm sm:text-lg font-semibold text-white"> Tu enlace de acceso</h3>
              </div>
              <div className="space-y-2">
                <p className="text-purple-100 text-xs sm:text-sm">
                  También hemos enviado tu enlace del dashboard de referidos por correo electrónico con todas las instrucciones.
                </p>
                <p className="text-purple-200 text-xs">
                  💡 Si no encuentras el correo, revisa tu carpeta de spam o promociones.
                </p>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-xl p-3 sm:p-4 shadow-xl">
              <div className="text-center">
                <p className="text-purple-300 text-xs sm:text-sm mb-1.5 sm:mb-2">Síguenos para más contenido</p>
                <div className="flex items-center justify-center space-x-1">
                  <div className="bg-purple-500/20 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1">
                    <span className="text-purple-200 text-xs sm:text-sm font-medium">@irrelevantclub.co</span>
                  </div>
                </div>
                <p className="text-purple-400 text-xs mt-1">Instagram • TikTok</p>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center lg:justify-start">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 hover:text-white backdrop-blur-sm text-sm sm:text-base"
              >
                <ArrowLeft className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5 sm:mr-2" />
                Volver al inicio
              </Button>
            </div>
          </div>

          {/* Columna Derecha - Beneficios Preview */}
          <div className={`transition-all duration-1000 ${showBenefits ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-8'}`}>
            <div className="bg-purple-900/30 backdrop-blur-2xl border border-purple-400/40 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl">

              {/* Preview Header */}
              <div className="text-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
                  <Star className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5 sm:mr-2 text-white" />
                  <span className="text-white font-medium text-xs sm:text-sm">Beneficio Exclusivo</span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                  🎁 Plan de Referidos
                </h2>

                <p className="text-purple-100 text-xs sm:text-sm lg:text-base">
                  Solo para <span className="text-green-200 font-semibold">Early Adopters</span> como tú
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3 sm:space-x-4 bg-purple-800/30 rounded-lg p-3 sm:p-4 hover:bg-purple-800/40 transition-all duration-300">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Users className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm sm:text-base">1 Referido</h4>
                    <p className="text-purple-200 text-xs sm:text-sm">20 Prompts Esenciales PDF</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4 bg-purple-800/30 rounded-lg p-3 sm:p-4 hover:bg-purple-800/40 transition-all duration-300">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Package className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm sm:text-base">4 Referidos</h4>
                    <p className="text-purple-200 text-xs sm:text-sm">1 Sesión grabada con caso de uso real</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4 bg-purple-800/30 rounded-lg p-3 sm:p-4 hover:bg-purple-800/40 transition-all duration-300">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm sm:text-base">7 Referidos</h4>
                    <p className="text-purple-200 text-xs sm:text-sm">50% Descuento Primer Mes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4 bg-purple-800/30 rounded-lg p-3 sm:p-4 hover:bg-purple-800/40 transition-all duration-300">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Crown className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm sm:text-base">12 Referidos</h4>
                    <p className="text-purple-200 text-xs sm:text-sm">3 meses GRATIS</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-purple-500/20">
                <p className="text-purple-200 text-xs">
                  📧 Instrucciones completas en tu bandeja de entrada
                </p>
              </div>
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

export default ThankYou;