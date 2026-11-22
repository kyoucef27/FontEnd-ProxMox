'use client';

import React from 'react';

/**
 * Velurian AuthProvider
 * Pure client-side wrapper replacing legacy NextAuth SessionProvider.
 * Authentication state is maintained via backend JWT tokens & HTTP cookies.
 */
export default function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
}
