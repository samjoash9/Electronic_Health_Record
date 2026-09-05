import { Navigate } from 'react-router-dom';
import { homeRouteFor } from './RequireAuth';
import { useAuth } from './useAuth';

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={homeRouteFor(user)} replace />;
}
