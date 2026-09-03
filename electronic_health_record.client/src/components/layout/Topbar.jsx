import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import Button from '../ui/Button';
import phoLogo from '../../assets/images/PHO_logo.jpg';

export default function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4">
      <div className="flex items-center gap-2">
        <img src={phoLogo} alt="Provincial Health Office" className="h-8 w-8 rounded object-cover" />
        <span className="text-sm font-semibold text-ink-900">Electronic Health Record</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-ink-900">{user?.name}</p>
          {/* admins show their tier, so a superadmin is not labelled plain "admin" */}
          <p className="text-xs capitalize text-ink-500">{user?.adminRole ?? user?.role}</p>
        </div>
        <Button type="button" variant="ghost" onClick={handleSignOut}>
          <LogOut size={16} className="mr-1" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
