import { Navigate } from 'react-router-dom';
import { homeRouteFor } from './RequireAuth';
import { useAuth } from './useAuth';
import { useStationChoice } from '../hooks/useStationChoice';

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const { station } = useStationChoice();
  if (loading) return null;
  return <Navigate to={homeRouteFor(user, station)} replace />;
}
