import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Mail,
  Lock,
  ShieldCheck,
  X,
  ArrowRight,
  UserCheck,
  Clock,
  Activity,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { homeRouteFor } from '../../auth/RequireAuth';
import { loginSchema } from '../../lib/schemas';
import { readStation } from '../../lib/stationStorage';
import Button from '../../components/ui/Button';
import ForgotPasswordModal from './ForgotPasswordModal';
import phoLogo from '../../assets/images/PHO_logo.jpg';

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        setIsLoginModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  if (isAuthenticated) {
    return <Navigate to={homeRouteFor(user, readStation(user?.role))} replace />;
  }

  const onSubmit = async (values) => {
    setLoginError('');

    try {
      const authenticatedUser = await signIn({
        identifier: values.identifier,
        password: values.password,
      });

      toast.success('Login successful.');
      navigate(homeRouteFor(authenticatedUser, readStation(authenticatedUser?.role)), {
        replace: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Invalid username or password.';

      setLoginError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen h-full overflow-y-auto scroll-smooth bg-slate-50 text-slate-800 flex flex-col font-['Geist',sans-serif] selection:bg-[#37AF9B]/20 selection:text-[#0A594D]">
      {/* 3. Top Navigation Bar */}
      <header className="flex justify-between items-center p-6 lg:px-12 w-full max-w-7xl mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center">
          <img src={phoLogo || '/PHO_logo.jpg'} alt="PHO Logo" className="h-8 w-auto object-contain mr-2" />
          <span className="text-xl font-bold text-[#0A594D]">
            eHPR System
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex gap-8 text-slate-600 font-medium text-sm">
          <a href="#home" className="hover:text-[#0A594D] transition-colors">Home</a>
          <a href="#services" className="hover:text-[#0A594D] transition-colors">Services</a>
          <a href="#faqs" className="hover:text-[#0A594D] transition-colors">FAQ&apos;s</a>
          <a href="#contact" className="hover:text-[#0A594D] transition-colors">Contact Us</a>
        </nav>

        {/* Right: Log In Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-[#0A594D] text-white px-6 py-2 rounded-full hover:bg-[#37AF9B] transition-colors font-medium text-sm shadow-sm hover:shadow"
          >
            Log In
          </button>
        </div>
      </header>

      {/* 4. Hero Section (Split Layout) */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-center">
        <section id="home" className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-6 lg:p-12 items-center">
          {/* Left Column (Text) */}
          <div className="flex flex-col items-start justify-center">
            {/* Accent Pill */}
            <div className="text-[#37AF9B] bg-[#37AF9B]/10 px-4 py-1 rounded-full text-sm font-semibold w-fit mb-4 flex items-center gap-1.5 border border-[#37AF9B]/20">
              <Sparkles size={14} />
              Smart Healthcare, Just for You
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-tight tracking-tight">
              Your Health, Our <span className="text-[#37AF9B]">Priority</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl">
              A comprehensive electronic health and patient record platform connecting registration,
              vital assessments, clinical consultations, dental, vision, and billing workflows in real time.
            </p>

            {/* Call to Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#services"
                className="border-2 border-[#0A594D] text-[#0A594D] hover:bg-[#0A594D] hover:text-white px-6 py-3 rounded-full font-medium text-sm transition-all shadow-xs inline-flex items-center"
              >
                Explore Services
              </a>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="cursor-pointer text-slate-600 hover:text-[#0A594D] font-medium text-sm flex items-center gap-1.5 transition-colors px-3 py-2"
              >
                Access Portal
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Column (Image Placeholder & Floating Cards) */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-lg mt-6 lg:mt-0 flex items-center justify-center">
            {/* AI Doctor Blended Image */}
            <img
              src="/AiDoc.jpg"
              alt="AI Doctor"
              className="w-full h-auto object-contain mix-blend-multiply drop-shadow-2xl"
            />

            {/* Floating Glassmorphism Card 1 (Top Left) */}
            <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/60 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#37AF9B]/15 text-[#0A594D]">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Licensed Practitioners</p>
                <p className="text-sm font-bold text-slate-900">Expert Doctors</p>
              </div>
            </div>

            {/* Floating Glassmorphism Card 2 (Bottom Right) */}
            <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/60 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#37AF9B]/15 text-[#0A594D]">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Clinic Operations</p>
                <p className="text-sm font-bold text-slate-900">24/7 Support</p>
              </div>
            </div>


          </div>
        </section>

        {/* 5. Bottom Features Section */}
        <section id="services" className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 lg:p-12 scroll-mt-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#37AF9B]/10 text-[#0A594D] mb-4">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Patient Flow</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track patient queues seamlessly across Station 1 registration, Station 2 vital assessment,
              physician consultation, and specialized dental and vision desks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#37AF9B]/10 text-[#0A594D] mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Unified Digital Records</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Certified medical summaries with digital signatures, PRC license tracking, and
              instant access for patients to view signed visit histories.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#37AF9B]/10 text-[#0A594D] mb-4">
              <HeartPulse size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Clinical Intelligence</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Comprehensive analytics tracking the 7 aspects of wellness, smoker lifestyle status,
              and station throughput for informed institutional decisions.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Electronic Health &amp; Patient Record System. All rights reserved.
      </footer>

      {/* 6. The Login Modal (The Pop-up) */}
      {isLoginModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLoginModalOpen(false);
          }}
        >
          {/* Modal Content: Existing two-panel login card UI */}
          <div className="relative flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Left Panel: Welcome Branding */}
            <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#37AF9B] to-[#0A594D] px-12 py-16 text-center text-white sm:flex">
              <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-black/10" />

              <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
                <ShieldCheck className="h-10 w-10" strokeWidth={1.5} />
              </div>

              <h2 className="relative z-10 text-3xl font-bold">Welcome Back!</h2>

              <p className="relative z-10 mt-3 max-w-64 text-base text-white/90">
                To stay connected with us please login with your personal information.
              </p>
            </div>

            {/* Right Panel: Sign-In Form */}
            <div className="relative flex w-full flex-col justify-center px-10 py-16 sm:w-1/2 sm:px-14">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                aria-label="Close login dialog"
                className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-center text-3xl font-bold text-[#0A594D]">Sign in</h2>
              <p className="mt-1 text-center text-sm text-slate-500">Login to your account to continue</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 rounded-full bg-[#eef1fb] px-4 py-3">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.5} />
                    <input
                      id="identifier"
                      autoComplete="username"
                      placeholder="Username"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      {...register('identifier')}
                    />
                  </div>
                  {errors.identifier?.message && (
                    <p className="mt-1 pl-4 text-[11px] text-rose-600">{errors.identifier.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 rounded-full bg-[#eef1fb] px-4 py-3">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.5} />
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      {...register('password')}
                    />
                  </div>
                  {errors.password?.message && (
                    <p className="mt-1 pl-4 text-[11px] text-rose-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-medium text-[#0A594D] underline-offset-2 transition hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>

                {loginError && <p className="text-xs text-rose-600 text-center">{loginError}</p>}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="mt-1 w-full uppercase tracking-wide"
                >
                  {isSubmitting ? 'Signing in...' : 'LOG IN'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}