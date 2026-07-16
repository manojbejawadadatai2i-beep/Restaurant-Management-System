import React, { useEffect, useRef } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Chatbot } from './components/common/Chatbot';
import { AppRoutes } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prevUserRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Detect user swap / role selection
    if (prevUserRef.current && prevUserRef.current.id !== currentUser.id) {
      if (currentUser.role === 'Administrator') {
        navigate('/users', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } 
    // Handle initial application load
    else if (!prevUserRef.current) {
      if (currentUser.role === 'Administrator') {
        if (location.pathname !== '/users') {
          navigate('/users', { replace: true });
        }
      } else {
        if (location.pathname === '/users') {
          navigate('/dashboard', { replace: true });
        }
      }
    }

    prevUserRef.current = currentUser;
  }, [currentUser, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 flex">
      {/* Left Sidebar Navigation */}
      <Sidebar />
      
      {/* Right Content Area */}
      <div className="flex-1 md:pl-20 flex flex-col min-w-0 transition-all duration-300">
        <Navbar />
        
        <main className="flex-1 px-8 py-8 w-full max-w-7xl mx-auto">
          <AppRoutes />
        </main>

        {/* Premium Footer */}
        <footer className="w-full px-8 py-6 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-550 transition-colors bg-white/20 dark:bg-transparent">
          <p>&copy; {new Date().getFullYear()} restaurant portal. All rights reserved.</p>
          <p className="mt-1 text-[9px] text-slate-350 dark:text-slate-655">
            Real-time PostgreSQL Data Link &bull; Built with React 19 + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>

      <Chatbot />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
