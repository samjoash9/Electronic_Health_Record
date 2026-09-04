import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { homeRouteFor } from '../../auth/RequireAuth';
import { loginSchema } from '../../lib/schemas';

const DEMO_CREDENTIALS = [
  { role: 'Super Admin', identifier: 'superadmin', password: 'password123' },
  { role: 'Admin', identifier: 'admin', password: 'password123' },
  { role: 'Doctor', identifier: 'doctor', password: 'password123' },
  { role: 'Patient', identifier: 'pho1001', password: 'password123' },
];

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');
  const [demoRole, setDemoRole] = useState('');

  const {
    register, handleSubmit, setValue, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const selectedDemo = DEMO_CREDENTIALS.find((cred) => cred.role === demoRole);

  const handleDemoSelect = (role) => {
    setDemoRole(role);
    const cred = DEMO_CREDENTIALS.find((c) => c.role === role);
    if (cred) {
      setValue('identifier', cred.identifier);
      setValue('password', cred.password);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={homeRouteFor(user.role)} replace />;
  }

  const onSubmit = async (values) => {
    setLoginError('');
    try {
      const signedInUser = await signIn(values);
      navigate(homeRouteFor(signedInUser.role), { replace: true });
    } catch (error) {
      setLoginError(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#e9fbf6] to-[#eef2f6] p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#1fc8a8] to-[#0e7d6b] px-12 py-16 text-center text-white sm:flex">
          <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-black/10" />

          <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
            <ShieldCheck className="h-10 w-10" strokeWidth={1.5} />
          </div>

          <h1 className="relative z-10 text-3xl font-bold">Welcome Back!</h1>
          <p className="relative z-10 mt-3 max-w-64 text-base text-white/90">
            To stay connected with us please login with your personal info.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center px-10 py-16 sm:w-1/2 sm:px-14">
          <h2 className="text-center text-3xl font-bold text-[#0e7d6b]">Sign in</h2>
          <p className="mt-1 text-center text-sm text-ink-500">Login in to your account to continue</p>

          <div className="mt-5 rounded-xl border border-dashed border-[#1fc8a8]/40 bg-[#f3fdfb] p-3">
            <label htmlFor="demo-role" className="text-[11px] font-semibold uppercase tracking-wide text-[#0e7d6b]">
              Demo credentials (temporary)
            </label>
            <div className="relative mt-1.5">
              <select
                id="demo-role"
                value={demoRole}
                onChange={(event) => handleDemoSelect(event.target.value)}
                className="w-full appearance-none rounded-lg border border-line bg-white px-3 py-2 pr-8 text-sm text-ink-900 outline-none focus:border-[#1fc8a8]"
              >
                <option value="">Select a role…</option>
                {DEMO_CREDENTIALS.map((cred) => (
                  <option key={cred.role} value={cred.role}>{cred.role}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" strokeWidth={1.5} />
            </div>
            {selectedDemo && (
              <p className="mt-2 text-xs text-ink-700">
                Username: <span className="font-mono font-semibold">{selectedDemo.identifier}</span>
                {' · '}
                Password: <span className="font-mono font-semibold">{selectedDemo.password}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 rounded-full bg-[#eef1fb] px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-ink-500" strokeWidth={1.5} />
                <input
                  id="identifier"
                  autoComplete="username"
                  placeholder="Username"
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier?.message && (
                <p className="mt-1 pl-4 text-[11px] text-rose-600">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 rounded-full bg-[#eef1fb] px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-ink-500" strokeWidth={1.5} />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
                  {...register('password')}
                />
              </div>
              {errors.password?.message && (
                <p className="mt-1 pl-4 text-[11px] text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <span className="cursor-default text-xs font-medium text-[#0e7d6b]">Forgot your password?</span>
            </div>

            {loginError && <p className="text-xs text-rose-600">{loginError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-12 w-full rounded-full bg-linear-to-r from-[#1fc8a8] to-[#14a690] text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
