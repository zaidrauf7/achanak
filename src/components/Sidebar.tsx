"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  LogOut, 
  ChefHat,
  Menu,
  ClipboardList,
  Map as MapIcon
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // Replace 'any' with a proper type if needed
  const [occupiedTableCount, setOccupiedTableCount] = useState(0);
  
  useEffect(() => {
      fetch('/api/auth/me')
        .then(res => {
            if (res.ok) return res.json();
            return null;
        })
        .then(data => setUser(data));

      const fetchStatus = () => {
           fetch('/api/orders?status=pending')
              .then(res => res.json())
              .then(data => {
                  if (Array.isArray(data)) {
                      const occupied = new Set();
                      data.forEach((o: any) => {
                           if (o.status === 'pending' && o.orderType === 'dine-in' && o.tableNo) {
                               occupied.add(o.tableNo);
                           }
                      });
                      setOccupiedTableCount(occupied.size);
                  }
              });
      };
      
      fetchStatus();
      const interval = setInterval(fetchStatus, 10000); // 10s
      return () => clearInterval(interval);
  }, []);

  const role = user?.role || "manager"; 

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
  };

  return (
    <div className={`
        bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-50 transition-all duration-300 overflow-x-hidden
        ${collapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}
    `}>
      
      {/* Header */}
      <div className={`p-4 border-b border-gray-100 flex items-center h-16 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        
        {/* Logo - Only visible when expanded */}
        {!collapsed && (
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-600 p-2 rounded-lg text-white shrink-0">
                    <ChefHat size={20} />
                </div>
                <div className="whitespace-nowrap">
                    <h1 className="font-bold text-lg text-gray-800 tracking-tight">Ach<span className="text-red-600">anak</span></h1>
                </div>
            </div>
        )}

        {/* Toggle Button (Bars) */}
        <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors hidden md:block"
        >
            <Menu size={24} />
        </button>

      </div>
      
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto mt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        {/* Only Manager & Owner can see Dashboard now */}
        <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium group relative ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
          <LayoutDashboard size={20} className={isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500'} />
          {!collapsed && <span>Dashboard</span>}
          {collapsed && (
              <div className="absolute left-full ml-6 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                  Dashboard
              </div>
          )}
        </Link>
        
        {/* Everyone sees New Order */}
        {/* Only Manager sees New Order & Menu */}
        {role !== 'owner' && (
            <>
                <Link href="/orders" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium group relative ${isActive('/orders') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
                    <ClipboardList size={20} className={isActive('/orders') ? 'text-blue-600' : 'text-gray-500'} />
                    {!collapsed && <span>Orders</span>}
                    {collapsed && (
                        <div className="absolute left-full ml-6 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                            Orders
                        </div>
                    )}
                </Link>

                <Link href="/dine-in" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium group relative ${isActive('/dine-in') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
                    <div className="relative">
                        <MapIcon size={20} className={isActive('/dine-in') ? 'text-blue-600' : 'text-gray-500'} />
                        {collapsed && occupiedTableCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                {occupiedTableCount}
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 flex justify-between items-center">
                            <span>Dine In</span>
                            {occupiedTableCount > 0 && (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {occupiedTableCount}
                                </span>
                            )}
                        </div>
                    )}
                    {collapsed && (
                        <div className="absolute left-full ml-6 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                            Dine In {occupiedTableCount > 0 && `(${occupiedTableCount})`}
                        </div>
                    )}
                </Link>

                <Link href="/create-order" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium group relative ${isActive('/create-order') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
                <ShoppingCart size={20} className={isActive('/create-order') ? 'text-blue-600' : 'text-gray-500'} />
                {!collapsed && <span>New Order</span>}
                {collapsed && (
                    <div className="absolute left-full ml-6 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        New Order
                    </div>
                )}
                </Link>

                <Link href="/menu" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium group relative ${isActive('/menu') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
                    <UtensilsCrossed size={20} className={isActive('/menu') ? 'text-blue-600' : 'text-gray-500'} />
                    {!collapsed && <span>Manage Menu</span>}
                    {collapsed && (
                    <div className="absolute left-full ml-6 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        Manage Menu
                    </div>
                )}
                </Link>
            </>
        )}

      </nav>

      {/* Footer / User */}
      <div className="p-3 border-t border-gray-100">
         {!collapsed ? (
             <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p> 
                </div>
             </div>
         ) : (
             <div className="mb-3 flex justify-center">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {user?.name?.[0] || 'U'}
                </div>
             </div>
         )}
         
        <button onClick={handleLogout} className={`w-full flex items-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium ${collapsed ? 'justify-center' : 'justify-center'}`}>
            <LogOut size={16} />
            {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
}
