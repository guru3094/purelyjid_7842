import React from 'react';

// Admin panel has its own layout — intentionally excludes AuthProvider
// to prevent Supabase auth calls on admin routes (admin uses local credential auth)
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
