import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/AuthContext';
import { routeElements } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  },
});

// createBrowserRouter (not <BrowserRouter>) so useBlocker (unsaved-changes
// guards) has the data router it requires — see routes.jsx.
const router = createBrowserRouter(routeElements);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-right"
          autoClose={3500}
          newestOnTop
          toastClassName="!min-h-0 !rounded-xl !border !border-line !bg-surface !p-4 !text-sm !font-medium !text-ink-900 !shadow-lg"
          progressClassName="!bg-[#129883]"
          icon={({ type }) =>
            type === 'error' ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">✕</div>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6] text-[#0e7d6b]">✓</div>
            )
          }
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
