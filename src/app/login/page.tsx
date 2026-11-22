'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Authentication rejected: Invalid credentials.');
        setIsLoading(false);
        return;
      }
      
      // Store token in localStorage and cookie
      localStorage.setItem('token', data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${8 * 3600}; SameSite=Lax`;
      
      // Hard navigation to dashboard
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'System error: Unable to contact authentication endpoint.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDED] flex flex-col justify-between p-6 sm:p-10">
      {/* Top Ledger Header */}
      <div className="flex justify-between items-center font-data text-[11px] uppercase tracking-[0.2em] text-neutral-500 border-b border-[#1A1D22] pb-4">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 bg-white inline-block" />
          <span className="text-white font-medium">VELURIAN</span>
          <span className="text-neutral-700">/</span>
          <span>SECURITY GATEWAY</span>
        </div>
        <div className="hidden sm:block">STATUS: STANDBY</div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto py-12">
        <div className="border border-[#22252C] bg-[#111317] p-8 sm:p-10 space-y-8 relative">
          {/* Subtle architectural corner accents */}
          <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-white/60" />
          <span className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t border-r border-white/60" />
          <span className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b border-l border-white/60" />
          <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-white/60" />

          {/* Header Typography */}
          <div className="space-y-3">
            <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-400 block">
              Authorization Required
            </span>
            <h1 className="text-3xl font-display font-normal text-white tracking-tight">
              Sign In to Console
            </h1>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Enter your verified credentials to access the Velurian catalog and transaction ledger.
            </p>
          </div>

          {/* Diagnostic Error Banner */}
          {error && (
            <div className="border border-rose-900/60 bg-rose-950/20 p-3.5 font-data text-xs text-rose-300">
              <span className="font-semibold block mb-0.5 text-rose-200">ACCESS DENIED</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label 
                htmlFor="email-address" 
                className="block font-data text-[11px] uppercase tracking-wider text-neutral-400"
              >
                Operator Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-[#0C0E11] border border-[#262A32] px-3.5 py-2.5 text-sm text-white font-data placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                placeholder="operator@velurian.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="password" 
                  className="block font-data text-[11px] uppercase tracking-wider text-neutral-400"
                >
                  Password Key
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full bg-[#0C0E11] border border-[#262A32] px-3.5 py-2.5 text-sm text-white font-data placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-white text-black font-data text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-200 focus:outline-none transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>AUTHENTICATING...</span>
                ) : (
                  <span>AUTHENTICATE &rarr;</span>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-[#1C1F25] flex items-center justify-between font-data text-[10px] text-neutral-400">
            <span>PROTOCOL: JWT / AES-256</span>
            <span>RESTRICTED TERMINAL</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Stamp */}
      <div className="flex flex-col sm:flex-row justify-between items-center font-data text-[10px] text-neutral-400 uppercase tracking-widest pt-4 border-t border-[#1A1D22] gap-2">
        <span>Velurian Atelier Core Infrastructure</span>
        <span>Authorized Personnel Only</span>
      </div>
    </div>
  );
}
