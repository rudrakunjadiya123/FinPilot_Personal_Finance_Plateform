import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Brain, BarChart3, Wallet, 
  TrendingUp, CreditCard, PiggyBank, Users, FileText,
  Sparkles, ChevronDown, Star, Zap, Lock, Globe,
  MessageCircle, Target, Bell, ArrowUpRight
} from 'lucide-react';

/* ────────────────────────────────────────────────────────
   ANIMATED NUMBER COUNTER HOOK
   ──────────────────────────────────────────────────────── */
function useCounter(target, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ────────────────────────────────────────────────────────
   FADE IN ON SCROLL COMPONENT
   ──────────────────────────────────────────────────────── */
function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   FEATURE DATA
   ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: BarChart3,
    title: 'Smart Dashboard',
    desc: 'Real-time insights into your cash flow, income, and spending patterns with beautiful, interactive charts.',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    icon: CreditCard,
    title: 'Loan & EMI Tracker',
    desc: 'Track all your loans, auto-generated EMI schedules, amortization tables, and repayment progress in one view.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Users,
    title: 'Lend & Borrow Manager',
    desc: 'Keep tabs on who owes you, interest accrual, partial repayments, and overdue alerts—no more awkward follow-ups.',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Brain,
    title: 'AI Financial Advisor',
    desc: 'Ask questions in plain English. Our Gemini-powered RAG chatbot analyzes your real data and gives personalized advice.',
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    icon: FileText,
    title: 'Statement Analysis',
    desc: 'Upload bank statements (PDF/CSV), auto-categorize transactions, and visualize spending with smart charts.',
    gradient: 'from-rose-500 to-orange-400',
  },
  {
    icon: Target,
    title: 'Savings Goals',
    desc: 'Set financial goals, track progress with visual milestones, and get AI-powered recommendations to reach them faster.',
    gradient: 'from-violet-500 to-indigo-400',
  },
];

const testimonials = [
  {
    name: 'Aarav Patel',
    role: 'Freelance Developer',
    quote: 'FinPilot completely transformed how I manage my finances. The AI chatbot actually understands my spending habits!',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Small Business Owner',
    quote: 'The Lend & Borrow tracker saved me from so many headaches. No more spreadsheets for tracking who owes what.',
    rating: 5,
  },
  {
    name: 'Rohan Mehta',
    role: 'Software Engineer',
    quote: 'Statement analysis is a game-changer. I upload my bank PDF and instantly see where my money goes every month.',
    rating: 5,
  },
];

/* ────────────────────────────────────────────────────────
   MAIN LANDING PAGE COMPONENT
   ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const usersCounter = useCounter(2500, 2000);
  const transactionsCounter = useCounter(150, 2000);
  const uptimeCounter = useCounter(99, 1800);

  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-hidden" style={{ fontFamily: "var(--font-body)" }}>

      {/* ═══════════════════════════════════════════════════════
          NAVBAR
          ═══════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-paper-raised/90 backdrop-blur-xl shadow-elevated border-b border-border-default'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>F</span>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>FinPilot</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-ink-soft hover:text-accent transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-ink-soft hover:text-accent transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium text-ink-soft hover:text-accent transition-colors">Testimonials</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-ink-soft hover:text-ink transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold accent-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-glow transition-all duration-300 btn-press"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-paper-raised border-b border-border-default p-4 space-y-3 animate-slide-down">
            <a href="#features" className="block text-sm font-medium text-ink-soft py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-ink-soft py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#testimonials" className="block text-sm font-medium text-ink-soft py-2" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <button onClick={() => navigate('/login')} className="w-full text-sm font-semibold accent-gradient text-white px-5 py-2.5 rounded-xl mt-2">
              Get Started Free
            </button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[700px] h-[700px] bg-accent/8 rounded-full -top-40 -left-40 blur-3xl" style={{ animation: 'float 8s ease-in-out infinite' }} />
          <div className="absolute w-[500px] h-[500px] bg-purple-500/5 rounded-full -bottom-20 -right-20 blur-3xl" style={{ animation: 'float 10s ease-in-out infinite reverse' }} />
          <div className="absolute w-[300px] h-[300px] bg-blue-500/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl" style={{ animation: 'float 6s ease-in-out infinite 2s' }} />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(var(--color-ink-val) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-val) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 bg-accent-soft border border-accent/20 rounded-full px-4 py-1.5 mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide uppercase">AI-Powered Financial Intelligence</span>
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={100}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6" style={{ fontFamily: "var(--font-display)" }}>
              Your Money,{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                  Reimagined
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C40 2 120 2 198 8" stroke="var(--color-accent-val)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-lg sm:text-xl text-ink-soft max-w-2xl mx-auto mb-10 leading-relaxed">
              FinPilot is the intelligent command center for your personal finances. 
              Track loans, manage lending, analyze bank statements, set savings goals, 
              and chat with an AI that actually understands your money.
            </p>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center gap-2 accent-gradient text-white font-semibold text-base px-8 py-4 rounded-2xl hover:shadow-glow transition-all duration-300 btn-press"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="flex items-center gap-2 text-ink font-semibold text-base px-8 py-4 rounded-2xl border border-border-strong hover:border-accent hover:text-accent transition-all duration-300"
              >
                Explore Features
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </FadeIn>

          {/* Hero Dashboard Preview */}
          <FadeIn delay={400}>
            <div className="relative max-w-5xl mx-auto">
              <div className="bg-paper-raised rounded-2xl border border-border-default shadow-elevated p-4 sm:p-6">
                {/* Mock browser chrome */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  <div className="flex-1 mx-4 h-7 bg-paper-sunken rounded-lg flex items-center px-3">
                    <Lock className="w-3 h-3 text-positive mr-2" />
                    <span className="text-xs text-ink-faint font-mono">finpilot.app/dashboard</span>
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Total Balance', value: '₹4,52,830', color: 'text-accent', icon: Wallet },
                    { label: 'Monthly Income', value: '₹85,000', color: 'text-positive', icon: TrendingUp },
                    { label: 'Active Loans', value: '3', color: 'text-info', icon: CreditCard },
                    { label: 'Goals Progress', value: '68%', color: 'text-purple-500', icon: Target },
                  ].map((card, i) => (
                    <div key={i} className="bg-paper-sunken rounded-xl p-3 text-left border border-border-default">
                      <div className="flex items-center gap-1.5 mb-2">
                        <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                        <span className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold">{card.label}</span>
                      </div>
                      <span className={`text-lg font-bold font-mono ${card.color}`}>{card.value}</span>
                    </div>
                  ))}
                </div>

                {/* Mock chart area */}
                <div className="bg-paper-sunken rounded-xl p-4 border border-border-default h-40 flex items-end gap-2 overflow-hidden">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md" style={{
                      height: `${h}%`,
                      background: i === 11 ? 'var(--color-accent-gradient)' : 'var(--color-accent-val)',
                      opacity: i === 11 ? 1 : 0.15 + (i * 0.06),
                      animation: `grow-bar 1s ease-out ${i * 0.08}s both`
                    }} />
                  ))}
                </div>
              </div>

              {/* Floating cards around the dashboard */}
              <div className="absolute -left-8 top-1/3 hidden lg:block" style={{ animation: 'float 5s ease-in-out infinite' }}>
                <div className="bg-paper-raised rounded-xl border border-border-default shadow-elevated p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-positive/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-positive" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-faint">Income</p>
                    <p className="text-sm font-bold text-positive font-mono">+₹85,000</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 top-1/4 hidden lg:block" style={{ animation: 'float 6s ease-in-out infinite 1s' }}>
                <div className="bg-paper-raised rounded-xl border border-border-default shadow-elevated p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-faint">AI Insight</p>
                    <p className="text-xs font-semibold text-ink">"Save ₹12K more"</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS BAR
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 border-y border-border-default bg-paper-raised/50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div ref={usersCounter.ref}>
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent font-mono" style={{ fontFamily: "var(--font-display)" }}>
                {usersCounter.count.toLocaleString()}+
              </p>
              <p className="text-sm text-ink-soft mt-1">Active Users</p>
            </div>
            <div ref={transactionsCounter.ref}>
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-mono" style={{ fontFamily: "var(--font-display)" }}>
                {transactionsCounter.count}K+
              </p>
              <p className="text-sm text-ink-soft mt-1">Transactions Analyzed</p>
            </div>
            <div ref={uptimeCounter.ref}>
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent font-mono" style={{ fontFamily: "var(--font-display)" }}>
                {uptimeCounter.count}.9%
              </p>
              <p className="text-sm text-ink-soft mt-1">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-accent-soft border border-accent/20 rounded-full px-4 py-1.5 mb-4">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">Powerful Features</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">master your money</span>
              </h2>
              <p className="text-ink-soft text-base">
                From intelligent loan tracking to AI-powered insights, FinPilot gives you complete control over your financial life.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 100}>
                <div className="group bg-paper-raised rounded-2xl border border-border-default p-6 hover:shadow-elevated hover:border-accent/30 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-paper-raised/50 border-y border-border-default">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Get started in{' '}
                <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">3 simple steps</span>
              </h2>
              <p className="text-ink-soft text-base">No complicated setup. Just sign up and start managing your finances smarter.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up for free in seconds. No credit card required.', icon: Globe },
              { step: '02', title: 'Connect Your Data', desc: 'Upload bank statements, add loans, income sources, and lending records.', icon: FileText },
              { step: '03', title: 'Get AI Insights', desc: 'Ask your AI advisor anything about your finances and get personalized guidance.', icon: Brain },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 150}>
                <div className="relative text-center group">
                  {/* Step number */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>{item.step}</span>
                  </div>
                  
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-accent/40 to-transparent" />
                  )}

                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{item.title}</h3>
                  <p className="text-sm text-ink-soft max-w-xs mx-auto">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS SECTION
          ═══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Loved by{' '}
                <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">thousands</span>
              </h2>
              <p className="text-ink-soft text-base">See what our users have to say about their FinPilot experience.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="bg-paper-raised rounded-2xl border border-border-default p-6 hover:shadow-elevated transition-all duration-300 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>

                  <p className="text-sm text-ink-soft leading-relaxed mb-6 flex-1 italic">"{t.quote}"</p>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-ink-faint">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-orange-500 to-amber-500 p-10 sm:p-16 text-center">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                  Ready to take control of your finances?
                </h2>
                <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
                  Join thousands of users who are already managing their money smarter with FinPilot.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="group inline-flex items-center gap-2 bg-white text-accent font-bold text-base px-8 py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 btn-press"
                >
                  Get Started — It's Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border-default bg-paper-raised/50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl accent-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>F</span>
              </div>
              <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>FinPilot</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-ink-soft">
              <a href="#features" className="hover:text-accent transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-accent transition-colors">How It Works</a>
              <a href="#testimonials" className="hover:text-accent transition-colors">Testimonials</a>
            </div>

            <p className="text-xs text-ink-faint">
              © {new Date().getFullYear()} FinPilot. Built with ❤️
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════
          CUSTOM ANIMATIONS (injected inline)
          ═══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes grow-bar {
          from { height: 0%; opacity: 0; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
