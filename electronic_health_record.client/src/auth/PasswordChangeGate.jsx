import { useAuth } from './useAuth';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';

// Shown by RequireAuth in place of any page while the account is still on its
// default password. Signing out drops the user, and RequireAuth then sends them
// to /login on its own.
export default function PasswordChangeGate() {
  const { signOut, passwordChanged } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <ChangePasswordModal open required onChanged={passwordChanged} onSignOut={signOut} />
    </div>
  );
}
