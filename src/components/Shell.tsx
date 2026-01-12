"use client";
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  // Don't show sidebar on login or landing page
  const isPublic = pathname === '/' || pathname === '/login';

  if (isPublic) {
      return <>{children}</>;
  }

  return (
     <div className="min-h-screen bg-gray-50 flex flex-col md:block">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
            <h1 className="font-bold text-lg text-gray-800">Resto<span className="text-blue-600">Pro</span></h1>
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
        </div>

        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        {/* Overlay for mobile when sidebar is open */}
        {!collapsed && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setCollapsed(true)}
            />
        )}

        <main className={`transition-all duration-300 pl-0 ${collapsed ? 'md:pl-20' : 'md:pl-64'} min-h-screen pt-4 md:pt-0`}>
            {children}
        </main>
     </div>
  );
}
