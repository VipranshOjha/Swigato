import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/react-query/queryClient';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
