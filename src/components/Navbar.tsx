'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  if (!mounted) {
    return (
      <header className="h-14 border-b border-[#1E2126] bg-[#0B0C0E] px-6 flex items-center justify-between">
        <span className="font-data text-xs tracking-[0.25em] uppercase text-neutral-500">VELURIAN</span>
      </header>
    );
  }

  // Don't display standard navbar on login screen if user lands there
  if (pathname === '/login') {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/products', label: 'Inventory' },
    { href: '/orders', label: 'Orders' },
    { href: '/upload', label: 'Ingest Asset' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#1E2126] bg-[#0B0C0E]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand Mark */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="group flex items-center space-x-2 text-white hover:text-neutral-200 transition-colors"
            >
              <span className="h-2 w-2 bg-white inline-block transition-transform duration-200 group-hover:scale-125" />
              <span className="font-data text-xs tracking-[0.3em] uppercase font-semibold">VELURIAN</span>
            </Link>
            <span className="hidden sm:inline-block font-data text-[10px] text-neutral-600 tracking-widest border-l border-[#1E2126] pl-3 uppercase">
              Ops Control
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-data tracking-wider uppercase transition-all duration-150 ${
                    isActive
                      ? 'text-white bg-[#17191D] border border-[#2A2E35]'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#121417]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* System status + Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 font-data text-[10px] text-neutral-400 tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>REGISTRY ACTIVE</span>
            </div>

            <button
              onClick={handleSignOut}
              className="font-data text-[11px] uppercase tracking-wider text-neutral-400 hover:text-rose-400 border border-[#23262D] hover:border-rose-900/50 bg-[#121417] px-3 py-1.5 transition-all duration-150 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
