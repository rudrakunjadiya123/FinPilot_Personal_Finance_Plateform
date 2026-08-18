import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function LoginPage() {
  const { login, isLoginLoading, loginError, register, isRegisterLoading, registerError } = useAuth();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate('/app');
    } catch(err) {
      // error tracked in useAuth state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-ink relative overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center shadow-glow mx-auto mb-4">
            <span className="text-white font-display font-bold text-2xl">F</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight">FinPilot</h1>
          <p className="text-sm text-ink-soft mt-1">Your intelligent financial command center</p>
        </div>

        {/* Card */}
        <div className="bg-paper-raised border border-border-default rounded-2xl p-8 shadow-elevated">
          <h2 className="font-display text-xl font-bold text-ink mb-6">
            {isRegistering ? 'Create account' : 'Welcome back'}
          </h2>

          {(loginError || registerError) && (
            <div className="mb-4 text-sm text-negative bg-negative-soft p-3 rounded-lg border border-negative/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-negative shrink-0" />
              {(loginError || registerError)?.response?.data?.error?.message || "Operation failed. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
               <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border-strong bg-paper-sunken px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
                    placeholder="Steve Jobs"
                  />
               </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border-strong bg-paper-sunken px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border-strong bg-paper-sunken px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoginLoading || isRegisterLoading}
              className="w-full mt-2 accent-gradient hover:shadow-glow text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 btn-press disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoginLoading || isRegisterLoading 
                ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} /> Processing...</span>
                : <>{isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />} {isRegistering ? 'Create Account' : 'Sign In'}</>
              }
            </button>
          </form>

          <div className="mt-6 text-center">
             <button 
               type="button" 
               onClick={() => setIsRegistering(!isRegistering)} 
               className="text-accent hover:text-accent-hover font-semibold text-sm transition-colors duration-150"
             >
               {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Create one'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
