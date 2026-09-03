import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, homeRouteFor } from './auth/RequireAuth';
import { useAuth } from './auth/useAuth';
import { ROLES } from './lib/constants';

import LoginPage from './features/auth/LoginPage';
import StationPickerPage from './features/auth/StationPickerPage';
import Station1Page from './features/station1/Station1Page';
import Station2QueuePage from './features/station2/Station2QueuePage';
import Station2AssessmentPage from './features/station2/Station2AssessmentPage';
import KioskPage from './features/station2/KioskPage';
import Station3QueuePage from './features/station3/Station3QueuePage';
import Station3ConsultationPage from './features/station3/Station3ConsultationPage';
import MyRecordPage from './features/patient/MyRecordPage';
import MyRecordDetailPage from './features/patient/MyRecordDetailPage';
import AppShell from './components/layout/AppShell';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={homeRouteFor(user?.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Kiosk is deliberately OUTSIDE AppShell: no sidebar, no nav. */}
      <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
        <Route path="/station2/:formId/kiosk" element={<KioskPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
          <Route path="/stations" element={<StationPickerPage />} />
          <Route path="/station1" element={<Station1Page />} />
          <Route path="/station1/:formId" element={<Station1Page />} />
          <Route path="/station2" element={<Station2QueuePage />} />
          <Route path="/station2/:formId" element={<Station2AssessmentPage />} />
        </Route>

        <Route element={<RequireAuth allow={[ROLES.DOCTOR]} />}>
          <Route path="/station3" element={<Station3QueuePage />} />
          <Route path="/station3/:formId" element={<Station3ConsultationPage />} />
        </Route>

        <Route element={<RequireAuth allow={[ROLES.PATIENT]} />}>
          <Route path="/my-record" element={<MyRecordPage />} />
          <Route path="/my-record/:formId" element={<MyRecordDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
