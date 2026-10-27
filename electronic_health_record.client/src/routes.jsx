import { lazy } from 'react';
import { Route, Navigate, createRoutesFromElements } from 'react-router-dom';
import { RequireAuth, RequireStation } from './auth/RequireAuth';
import HomeRedirect from './auth/HomeRedirect';
import { ROLES, STATIONS } from './lib/constants';

import LoginPage from './features/auth/LoginPage';
import AppShell from './components/layout/AppShell';

// Every page but the login screen loads on first visit rather than up front:
// the eager bundle carried the charts, PDF export and all six stations for
// every user, patients included. AppShell (and App, for the routes outside
// it) hold the Suspense boundaries these resolve under.
/* eslint-disable react-refresh/only-export-components -- lazy page handles sit beside the route table that uses them; this module is config, not a component to hot-swap */
const StationPickerPage = lazy(() => import('./features/auth/StationPickerPage'));
const NoStationPage = lazy(() => import('./features/auth/NoStationPage'));
const DashboardPage = lazy(() => import('./features/admin/DashboardPage'));
const FormsPage = lazy(() => import('./features/admin/FormsPage'));
const FormDetailPage = lazy(() => import('./features/admin/FormDetailPage'));
const FormEditPage = lazy(() => import('./features/admin/FormEditPage'));
const ActivityLogsPage = lazy(() => import('./features/admin/ActivityLogsPage'));
const HealthReportsPage = lazy(() => import('./features/reports/HealthReportsPage'));
const OnboardingPage = lazy(() => import('./features/admin/onboarding/OnboardingPage'));
const Station1Page = lazy(() => import('./features/station1/Station1Page'));
const Station2QueuePage = lazy(() => import('./features/station2/Station2QueuePage'));
const Station2AssessmentPage = lazy(() => import('./features/station2/Station2AssessmentPage'));
const KioskPage = lazy(() => import('./features/station2/KioskPage'));
const Station3QueuePage = lazy(() => import('./features/station3/Station3QueuePage'));
const Station3ConsultationPage = lazy(() => import('./features/station3/Station3ConsultationPage'));
const Station4QueuePage = lazy(() => import('./features/station4/Station4QueuePage'));
const Station4DentalPage = lazy(() => import('./features/station4/Station4DentalPage'));
const Station5QueuePage = lazy(() => import('./features/station5/Station5QueuePage'));
const Station5VisionPage = lazy(() => import('./features/station5/Station5VisionPage'));
const Station6BillingPage = lazy(() => import('./features/station6/Station6BillingPage'));
const MyRecordPage = lazy(() => import('./features/patient/MyRecordPage'));
const MyRecordDetailPage = lazy(() => import('./features/patient/MyRecordDetailPage'));
/* eslint-enable react-refresh/only-export-components */

// createRoutesFromElements + createBrowserRouter (in App.jsx) instead of a plain
// <Routes>/<BrowserRouter> tree — useUnsavedChangesGuard's useBlocker throws
// "must be used within a data router" without it.
export const routeElements = createRoutesFromElements(
  <>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<HomeRedirect />} />

    {/* Kiosk and station picker are deliberately OUTSIDE AppShell: no sidebar, no nav. */}
    <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
      <Route path="/station2/:formId/kiosk" element={<KioskPage />} />
    </Route>

    {/* Stations 1-2 are a property of the device, so an admin picks which desk
        this tablet is serving. Doctors are assigned a station on their account
        and never see this page. */}
    <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
      <Route path="/stations" element={<StationPickerPage />} />
    </Route>

    {/* Safety net for a doctor whose account carries no station. */}
    <Route element={<RequireAuth allow={[ROLES.DOCTOR]} />}>
      <Route path="/no-station" element={<NoStationPage />} />
    </Route>

    <Route element={<AppShell />}>
      {/* Forms is the read-only record of finished work, so doctors reach it too:
          the station queues only carry what is still pending, and a consultation
          they have already signed is findable nowhere else. Cancel and delete
          inside the page stay gated on superadmin. */}
      <Route element={<RequireAuth allow={[ROLES.ADMIN, ROLES.DOCTOR]} />}>
        <Route path="/forms" element={<FormsPage />} />
        <Route path="/forms/:formId" element={<FormDetailPage />} />
        {/* Population figures, no single patient's chart: the doctors read
            them as much as the admins who run the programme. */}
        <Route path="/health-reports" element={<HealthReportsPage />} />
      </Route>

      <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/station1" element={<Station1Page />} />
        <Route path="/station1/:formId" element={<Station1Page />} />
        <Route path="/station2" element={<Station2QueuePage />} />
        <Route path="/station2/:formId" element={<Station2AssessmentPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        {/* Billing is not a per-device desk like stations 1-2 -- any admin may
            open it whichever station this tablet is set to, same as onboarding. */}
        <Route path="/station6" element={<Station6BillingPage />} />
      </Route>

      <Route element={<RequireAuth allow={[ROLES.ADMIN]} requireSuperAdmin />}>
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        {/* Correcting a signed record is a superadmin act, so the editor is a
            superadmin route rather than a button the detail page hides. The
            detail view itself stays open to admins and doctors. */}
        <Route path="/forms/:formId/edit" element={<FormEditPage />} />
      </Route>

      {/* RequireStation pins each desk to the station assigned to this doctor's
          account, so a doctor can't reach another station's queue by typing its
          URL. A superadmin passes through all three. */}
      <Route element={<RequireAuth allow={[ROLES.DOCTOR]} allowSuperAdmin />}>
        <Route element={<RequireStation station={STATIONS.THREE} />}>
          <Route path="/station3" element={<Station3QueuePage />} />
          <Route path="/station3/:formId" element={<Station3ConsultationPage />} />
        </Route>
        <Route element={<RequireStation station={STATIONS.FOUR} />}>
          <Route path="/station4" element={<Station4QueuePage />} />
          <Route path="/station4/:formId" element={<Station4DentalPage />} />
        </Route>
        <Route element={<RequireStation station={STATIONS.FIVE} />}>
          <Route path="/station5" element={<Station5QueuePage />} />
          <Route path="/station5/:formId" element={<Station5VisionPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allow={[ROLES.PATIENT]} />}>
        <Route path="/my-record" element={<MyRecordPage />} />
        <Route path="/my-record/:formId" element={<MyRecordDetailPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </>,
);
