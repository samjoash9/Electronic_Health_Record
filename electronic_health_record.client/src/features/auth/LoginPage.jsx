import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/useAuth';
import { homeRouteFor } from '../../auth/RequireAuth';
import { loginSchema } from '../../lib/schemas';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import phoLogo from '../../assets/images/PHO_logo.jpg';

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

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
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center gap-2">
          <img src={phoLogo} alt="Provincial Health Office" className="h-12 w-12 rounded object-cover" />
          <h1 className="text-lg font-semibold text-ink-900">Electronic Health Record</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Field label="Username" htmlFor="identifier" error={errors.identifier?.message}>
            <Input id="identifier" autoComplete="username" {...register('identifier')} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          </Field>

          {loginError && <p className="text-xs text-rose-600">{loginError}</p>}

          <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-5 rounded bg-gray-50 p-3 text-[11px] text-ink-500">
          <p className="font-medium text-ink-700">Demo credentials</p>
          <p>admin / password123</p>
          <p>doctor / password123</p>
          <p>patient: employee ID without punctuation, e.g. pho1001 / password123</p>
        </div>
      </div>
    </div>
  );
}
