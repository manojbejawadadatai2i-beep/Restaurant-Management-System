import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import axios from './utils/axios';
import { Sidebar } from './components/layout/Sidebar';
import { AppRoutes } from './routes';
import { LandingPage } from './pages/landing/LandingPage';
import { PasswordReminderBanner } from './components/notifications/PasswordReminderBanner';
import { ChangePasswordModal } from './components/notifications/ChangePasswordModal';
import { 
  Sun, 
  Moon, 
  ChevronDown, 
  ShieldAlert,
  KeyRound,
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Menu,
  LayoutDashboard,
  Store as StoreIcon,
  FileText,
  Users as UsersIcon,
  Utensils
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const AppContent: React.FC = () => {
  const { currentUser, logout, isLoading } = useAuth();

  // Navbar and Chatbot state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: 'Hi there! 👋 I am your Restaurant Portal Assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [chatTyping, setChatTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen, chatTyping]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatTyping(true);

    try {
      const response = await axios.post('/chat/query', {
        query: text,
        session_id: 'default_session',
        userId: currentUser?.id,
        user_role: currentUser?.role,
        assigned_store_id: currentUser?.assigned_store_id
      }, {
        headers: currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}
      });

      setChatMessages((prev) => [...prev, {
        id: Date.now().toString(),
        text: response.data.answer,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error communicating with the Ocean View AI service.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setChatTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Validating Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 flex">
      {/* Left Sidebar Navigation (Desktop) */}
      <Sidebar />

      {/* Slide-over Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    <Utensils size={16} />
                  </div>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">restaurant<span className="font-light text-slate-400">.</span></span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1.5">
                <NavLink 
                  to="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${isActive ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <LayoutDashboard size={18} /> Dashboard
                </NavLink>
                <NavLink 
                  to="/stores" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <StoreIcon size={18} /> Stores
                </NavLink>
                <NavLink 
                  to="/reports" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <FileText size={18} /> Reports
                </NavLink>
                <NavLink 
                  to="/users" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${isActive ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <UsersIcon size={18} /> User Access
                </NavLink>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{currentUser?.username}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 px-2 shadow-lg">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-bold transition-colors ${isActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/stores"
          className={({ isActive }) => `flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-bold transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <StoreIcon size={18} />
          <span>Stores</span>
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) => `flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-bold transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <FileText size={18} />
          <span>Reports</span>
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) => `flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-bold transition-colors ${isActive ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <UsersIcon size={18} />
          <span>Users</span>
        </NavLink>
      </nav>
      
      {/* Right Content Area */}
      <div className="flex-1 md:pl-20 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Header Layout */}
        <header className="sticky top-0 z-20 w-full border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
          <div className="px-4 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
              
              <div className="md:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Utensils size={14} />
                </div>
                <span className="text-sm font-extrabold tracking-tight text-slate-850 dark:text-white">
                  restaurant<span className="font-light text-slate-400">.</span>
                </span>
              </div>

              <div className="hidden md:block flex-1"></div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400 hover:bg-violet-100/60 dark:hover:bg-violet-950/60 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
              </button>

              <span className="w-px h-6 bg-slate-100 dark:bg-slate-800"></span>

              {/* Profile & Role switcher */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {currentUser ? currentUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block pr-1">
                    <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-150 flex items-center gap-1">
                      <span>{currentUser ? currentUser.username : 'Loading...'}</span>
                      <ChevronDown size={12} className="text-slate-450" />
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      {currentUser ? currentUser.role : ''}
                    </p>
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-slate-100/60 dark:divide-slate-800 transition-all duration-200 z-30">
                    <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-t-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">{currentUser?.username}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{currentUser?.role}</p>
                      <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                        Scope: {currentUser?.store_name || currentUser?.district_name || currentUser?.region_name || 'System-Wide'}
                      </p>
                    </div>

                    <div className="py-2 px-2 space-y-1">
                      <button
                        onClick={() => {
                          setIsChangePassOpen(true);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-semibold flex items-center gap-2"
                      >
                        <KeyRound size={14} className="text-amber-500" /> Change Password
                      </button>
                      
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors font-bold flex items-center gap-2"
                      >
                        <ShieldAlert size={14} className="text-red-400" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Panel Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 w-full max-w-7xl mx-auto pb-24 md:pb-8">
          <PasswordReminderBanner />
          <AppRoutes />
        </main>
        
        <ChangePasswordModal
          isOpen={isChangePassOpen}
          onClose={() => setIsChangePassOpen(false)}
        />

        {/* Footer */}
        <footer className="w-full px-4 sm:px-8 py-6 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 transition-colors bg-white/20 dark:bg-transparent pb-24 md:pb-6">
          <p>&copy; {new Date().getFullYear()} restaurant portal. All rights reserved.</p>
          <p className="mt-1 text-[9px] text-slate-300 dark:text-slate-600">
            Real-time PostgreSQL Data Link &bull; Built with React 19 + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>      {/* Floating Chatbot Overlay (Hidden for Admin / Super Admin Portal) */}
      {currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
          {chatOpen && (
            <div className="mb-4 w-[calc(100vw-2rem)] sm:w-96 h-[480px] sm:h-[520px] rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden backdrop-blur-md transition-all duration-300 transform scale-100 origin-bottom-right animate-in fade-in slide-in-from-bottom-5">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                    <Bot size={22} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                      Restaurant Portal AI
                      <Sparkles size={13} className="text-amber-200 fill-amber-200" />
                    </h3>
                    <span className="text-[10px] text-orange-105 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Online Assistant
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-200/50 dark:border-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0 self-end mb-1">
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm shadow-sm transition-all ${
                        msg.sender === 'user'
                          ? 'bg-orange-500 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 border border-slate-105 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-orange-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-655 dark:text-slate-400 flex-shrink-0 self-end mb-1">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

                {chatTyping && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-200/50 dark:border-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0 self-end mb-1">
                      <Bot size={14} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl rounded-bl-none px-3.5 py-3 text-sm shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 dark:bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-orange-400 dark:bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-orange-400 dark:bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center shadow-md shadow-orange-500/10"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 relative group animate-in fade-in"
            aria-label="Toggle chat assistant"
          >
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border border-white dark:border-slate-950 flex items-center justify-center text-[8px] font-bold">1</span>
            </span>
            {chatOpen ? <X size={24} className="rotate-0 hover:rotate-90 transition-transform duration-200" /> : <MessageSquare size={24} className="hover:scale-110 transition-transform duration-205" />}
          </button>
        </div>
      )}   </div>
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