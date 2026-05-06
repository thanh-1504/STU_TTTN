import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import router from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4500,
          style: {
            borderRadius: '12px',
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '420px',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            duration: 6000,
          },
        }}
      />
    </QueryClientProvider>
  );
}

