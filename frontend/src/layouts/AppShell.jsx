import React, { useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Landmark, Users, Wallet, Target, 
  LogOut, Menu, MessageSquare, Brain, X,
  Sun, Moon, ChevronRight
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import ChatPanel from '../components/ChatPanel';
import NotificationBell from '../components/NotificationBell';

const navItems = [
  { label: 'Dashboard', path: '/app', icon: Home },
  { label: 'Loans', path: '/app/loans', icon: Landmark },
  { label: 'Lend & Borrow', path: '/app/lend-borrow', icon: Users },
  { label: 'Income', path: '/app/income', icon: Wallet },
  { label: 'Goals', path: '/app/goals', icon: Target },
  { label: 'Statements & AI', path: '/app/statements', icon: Brain },
  { label: 'FinPilot AI Chat', path: '/app/chat', icon: MessageSquare },
];

export default function AppShell() {
  const { isAuthenticated, isUserLoading, logout, user } = useAuth();
  const { toggleChat, theme, toggleTheme } = useUIStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          <span className="text-ink-soft font-body">Loading FinPilot...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentTitle = navItems.find(n => n.path === location.pathname || (n.path !== '/app' && location.pathname.startsWith(n.path)))?.label || "Finpilot";

  return (
    <div className="flex h-screen print:h-auto overflow-hidden print:overflow-visible bg-paper font-body text-ink">
      
      {/* ════ Sidebar (Desktop) ════ */}
      <aside className="w-[260px] bg-sidebar border-r border-border-default flex-col justify-between hidden md:flex shrink-0 transition-colors duration-300 print:hidden">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border-default">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-sm">
                <span className="text-white font-display font-bold text-sm">F</span>
              </div>
              <span className="font-display text-xl font-bold text-ink tracking-tight">FinPilot</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-3 pt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold text-ink-faint uppercase tracking-[0.12em]">Pages</p>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium nav-hover ${
                      isActive 
                        ? 'bg-accent-soft text-accent shadow-sm' 
                        : 'text-ink-soft hover:bg-paper-sunken hover:text-ink'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border-default m-3 mt-0 rounded-xl bg-paper-sunken/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center text-white font-display font-semibold text-sm shrink-0 shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <span className="text-sm font-semibold text-ink truncate block">{user?.name || 'User'}</span>
                <span className="text-[11px] text-ink-faint truncate block">{user?.email || ''}</span>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="p-2 text-ink-faint hover:text-negative hover:bg-negative-soft/50 transition-all duration-200" 
              title="Sign out"
            >
              <LogOut className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ════ Mobile Sidebar Overlay ════ */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden animate-fade-in print:hidden" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-[280px] bg-sidebar border-r border-border-default z-[90] md:hidden flex flex-col animate-slide-up shadow-elevated print:hidden">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border-default">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-sm">
                  <span className="text-white font-display font-bold text-sm">F</span>
                </div>
                <span className="font-display text-xl font-bold text-ink">FinPilot</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-ink-soft hover:text-ink rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium ${
                      isActive 
                        ? 'bg-accent-soft text-accent' 
                        : 'text-ink-soft hover:bg-paper-sunken hover:text-ink'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* ════ Main Content Area ════ */}
      <main className="flex-1 flex flex-col h-full bg-paper min-w-0 transition-colors duration-300">
        {/* Top Header Bar */}
        <header className="h-16 min-h-[64px] border-b border-border-default flex items-center justify-between px-6 bg-paper-raised transition-colors duration-300 print:hidden">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-paper-sunken transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-bold text-ink tracking-tight">{currentTitle}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Page-specific action buttons mount here */}
            <div id="topbar-actions"></div>
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl hover:bg-paper-sunken text-ink-soft hover:text-accent transition-all duration-200 btn-press"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="theme-toggle-icon">
                {theme === 'dark' 
                  ? <Sun className="w-[18px] h-[18px]" /> 
                  : <Moon className="w-[18px] h-[18px]" />
                }
              </div>
            </button>

            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto print:overflow-visible p-4 md:p-8 relative">
          <Outlet />
          
          {/* AI Chat Floating Action Button */}
          <button 
            onClick={toggleChat}
            className="fixed bottom-6 right-6 w-14 h-14 accent-gradient hover:shadow-glow text-white rounded-2xl flex items-center justify-center shadow-elevated transition-all duration-200 hover:scale-105 active:scale-95 z-40 btn-press"
            title="Ask Finpilot AI"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* ════ AI Chat Panel ════ */}
      <ChatPanel />
    </div>
  );
}
