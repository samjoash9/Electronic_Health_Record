import { useAuth } from '../../auth/useAuth';
import { ShieldAlert } from 'lucide-react';

/**
 * Where a doctor lands when their account carries no station. The column is
 * required, so this should be unreachable -- it exists because a blank screen
 * on a malformed session tells the user nothing, and this tells them who to
 * ask.
 */
export default function NoStationPage() {
  const { signOut } = useAuth();

  return (
    <div className="flex h-full min-h-full items-center justify-center bg-linear-to-br from-[#e9fbf6] to-[#eef2f6] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white px-10 py-12 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert className="h-8 w-8" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-[#0e7d6b]">No station assigned</h1>

        <p className="mt-3 text-sm text-ink-500">
          Your account has not been assigned to a station yet. Contact your
          administrator so they can assign you one, then sign in again.
        </p>

        <button
          type="button"
          onClick={signOut}
          className="mt-8 h-12 w-full rounded-full bg-linear-to-r from-[#1fc8a8] to-[#14a690] text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-105"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
