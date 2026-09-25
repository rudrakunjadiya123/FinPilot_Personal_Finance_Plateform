import React, { useState, useEffect } from 'react';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogoutModal) {
        setShowLogoutModal(false);
      }
    };
    if (showLogoutModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutModal]);

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
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] nav-hover transition-colors ${
                      isActive 
                        ? 'bg-accent-soft text-accent-text font-semibold shadow-sm' 
                        : 'font-medium text-ink-soft hover:bg-paper-sunken hover:text-ink'
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
              onClick={() => setShowLogoutModal(true)} 
              className="p-2 text-ink-faint hover:text-negative hover:bg-negative-soft/50 rounded-lg transition-all duration-200" 
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
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                      isActive 
                        ? 'bg-accent-soft text-accent-text font-semibold' 
                        : 'font-medium text-ink-soft hover:bg-paper-sunken hover:text-ink'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile User Profile Footer */}
            <div className="p-4 border-t border-border-default m-3 mt-auto rounded-xl bg-paper-sunken/50">
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
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutModal(true);
                  }} 
                  className="p-2 text-ink-faint hover:text-negative hover:bg-negative-soft/50 rounded-lg transition-all duration-200" 
                  title="Sign out"
                >
                  <LogOut className="w-[16px] h-[16px]" />
                </button>
              </div>
            </div>
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

      {/* ════ Logout Confirmation Modal Pop-up ════ */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Dialog Card */}
          <div className="relative bg-paper-raised w-full max-w-sm rounded-2xl border border-border-default shadow-elevated p-6 animate-scale-in flex flex-col items-center text-center z-10">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-negative to-warning rounded-t-2xl" />

            {/* Warning / Signout Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-negative-soft text-negative flex items-center justify-center mb-4 mt-1">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-lg text-ink">
              Log out of FinPilot?
            </h3>

            {/* Description */}
            <p className="text-xs text-ink-soft mt-2 leading-relaxed">
              Are you sure you want to end your current session? You will need to sign back in with your credentials to access your financial dashboard.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-ink-soft bg-paper-sunken hover:bg-border-default border border-border-default transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-negative hover:opacity-90 shadow-sm transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ AI Chat Panel ════ */}
      <ChatPanel />
    </div>
  );
}
