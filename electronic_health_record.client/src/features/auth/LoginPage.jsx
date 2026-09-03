import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/useAuth';
import { homeRouteFor } from '../../auth/RequireAuth';
import { loginSchema } from '../../lib/schemas';
import { ROLES } from '../../lib/constants';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import phoLogo from '../../assets/images/PHO_logo.jpg';

const ROLE_TABS = [
  { value: ROLES.ADMIN, label: 'Staff', identifierLabel: 'Username' },
  { value: ROLES.DOCTOR, label: 'Doctor', identifierLabel: 'Username' },
  { value: ROLES.PATIENT, label: 'Employee', identifierLabel: 'Employee ID' },
];

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');

  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: ROLES.ADMIN, identifier: '', password: '' },
  });

  const role = watch('role');
  const activeTab = ROLE_TABS.find((t) => t.value === role) ?? ROLE_TABS[0];

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

        <div className="mb-4 grid grid-cols-3 gap-1 rounded bg-gray-100 p-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setValue('role', tab.value)}
              className={`rounded px-2 py-1.5 text-xs font-medium transition ${
                role === tab.value ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Field label={activeTab.identifierLabel} htmlFor="identifier" error={errors.identifier?.message}>
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
          <p>Staff: admin / password123</p>
          <p>Doctor: doctor / password123</p>
          <p>Employee: the Employee ID registered at Station 1 / password123</p>
        </div>
      </div>
    </div>
  );
}
