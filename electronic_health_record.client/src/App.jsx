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
        <ToastContainer position="top-right" autoClose={3500} newestOnTop />
      </AuthProvider>
    </QueryClientProvider>
  );
}
