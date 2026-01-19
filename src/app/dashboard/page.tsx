"use client";
import React, { useEffect, useState } from "react";
import { Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import Loader from "@/components/ui/Loader";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, topItems: [] });
  const [tableStats, setTableStats] = useState({ total: 0, occupied: 0 });
  const [loading, setLoading] = useState(true);

  // Historical Data State (Owner only)
  const [historyDate, setHistoryDate] = useState('');
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Still using mock data for the weekly/hourly charts for now as we don't have historical info in DB yet
  const weeklyData = [
    { name: 'Mon', sales: 0 },
    { name: 'Tue', sales: 0 },
    { name: 'Wed', sales: 0 },
    { name: 'Thu', sales: 0 },
    { name: 'Fri', sales: 0 },
    { name: 'Sat', sales: 0 },
    { name: 'Today', sales: 0 }, // We will update this one dynamically below
  ];
  
  const hourlyData = [
     { name: '12pm', orders: 2 },
     { name: '1pm', orders: 5 },
     { name: '2pm', orders: 1 },
     { name: '6pm', orders: 8 },
     { name: '7pm', orders: 12 },
     { name: '8pm', orders: 6 },
  ];

  const [user, setUser] = useState<any>(null);
  const [activeManagers, setActiveManagers] = useState<any[]>([]);

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch User & Setup
    fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(userData => {
            setUser(userData);
            
            // If Owner, fetch initially AND set up polling
            if (userData && userData.role === 'owner') {
                const fetchActiveManagers = () => {
                    fetch('/api/users')
                        .then(res => res.ok ? res.json() : [])
                        .then(managers => {
                            if (Array.isArray(managers)) {
                                const active = managers.filter((m: any) => 
                                    m.lastLogin && (!m.lastLogout || new Date(m.lastLogin) > new Date(m.lastLogout))
                                );
                                setActiveManagers(active);
                            }
                        });
                };

                fetchActiveManagers(); // Initial fetch
                const interval = setInterval(fetchActiveManagers, 5000); // Poll every 5s
                return () => clearInterval(interval);
            }
        });

    // 2. Fetch Sales Stats
    fetch("/api/sales")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
      
    // 3. Fetch Weekly History
    fetch("/api/sales/history?range=7d")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
          if(Array.isArray(data) && data.length > 0) {
              setChartData(data);
          } else {
              // Fallback simple mock if no data
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const today = new Date().getDay();
              const mock = [];
              for(let i=6; i>=0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  mock.push({ name: days[d.getDay()], sales: 0 });
              }
              setChartData(mock);
          }
      });
    
    // 4. Fetch Table Stats
    Promise.all([
        fetch('/api/settings').then(res => res.json()),
        fetch('/api/orders?status=pending').then(res => res.json())
    ]).then(([settings, orders]) => {
         // ... existing logic
         const total = settings.totalTables || 12;
         let occupied = 0;
         if (Array.isArray(orders)) {
             const unique = new Set();
             orders.forEach((o: any) => {
                 if (o.status === 'pending' && o.orderType === 'dine-in' && o.tableNo) {
                     unique.add(o.tableNo);
                 }
             });
             occupied = unique.size;
         }
         setTableStats({ total, occupied });
    });
  }, []);

  // Fetch Historical stats when date changes
  useEffect(() => {
    if (historyDate && user?.role === 'owner') {
        setLoadingHistory(true);
        fetch(`/api/sales?date=${historyDate}`)
            .then(res => res.json())
            .then(data => {
                setHistoryStats(data);
                setLoadingHistory(false);
            });
    }
  }, [historyDate, user]);

  // Sync the chart "Today" value with actual data
  if (stats.totalRevenue > 0) {
      weeklyData[6].sales = stats.totalRevenue;
  }

  if (loading) {
      return <Loader fullScreen={false} className="min-h-[80vh]" text="Loading dashboard data..." />;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {user ? `Welcome back, ${user.name}` : "Dashboard"}
                </h1>
                <p className="text-gray-500 mt-1 text-sm md:text-base">
                    {user?.role === 'owner' ? 'Owner Overview' : 'Real-time overview'} for <span className="font-semibold text-blue-600">{new Date().toLocaleDateString()}</span>
                </p>
            </div>
            {user?.role === 'owner' && (
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 w-fit">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    Owner Access
                </div>
            )}
        </header>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-gray-500 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Total Revenue</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-2xl md:text-4xl font-bold text-gray-900">Rs {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-gray-400">Total cash today</div>
            </div>
            
             <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-gray-500 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Orders Served</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-2xl md:text-4xl font-bold text-gray-900">{stats.totalOrders}</span>
                     <span className="hidden md:inline-block text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                 <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-gray-400">Bills generated</div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-gray-500 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Avg. Ticket</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-2xl md:text-4xl font-bold text-gray-900">
                         Rs {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(0) : "0"}
                     </span>
                </div>
                 <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-gray-400">Avg spend/cust</div>
            </div>

            {/* Table Status */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <h3 className="text-gray-500 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Table Status</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-2xl md:text-4xl font-bold text-red-600">{tableStats.occupied}</span>
                     <span className="text-lg md:text-xl font-medium text-gray-400">/ {tableStats.total}</span>
                </div>
                <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-gray-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tableStats.occupied > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                    {tableStats.occupied > 0 ? 'Occupied' : 'All Free'}
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full opacity-50"></div>
            </div>

            {/* Active Managers - Owner Only */}
            {user?.role === 'owner' && (
                 <div className="col-span-2 lg:col-span-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                    <h3 className="text-gray-500 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Active Staff</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl md:text-4xl font-bold text-green-600">{activeManagers.length}</span>
                        <span className="text-[10px] md:text-sm font-medium text-gray-400">Managers Online</span>
                    </div>
                    <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-gray-400">
                         {activeManagers.length > 0 ? (
                             <div className="flex flex-col gap-1 mt-1">
                                {activeManagers.map((m: any) => (
                                    <div key={m._id} className="flex items-center justify-between bg-green-50 p-2 md:p-2 rounded-lg border border-green-100">
                                         <span className="font-medium text-green-800 truncate">{m.name}</span>
                                         <span className="text-[10px] text-green-600 whitespace-nowrap">
                                             Since {new Date(m.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </span>
                                    </div>
                                ))}
                             </div>
                         ) : 'No managers currently active'}
                    </div>
                 </div>
            )}
        </div>

        {/* Sales History Filter - Owner Only */}
        {user?.role === 'owner' && (
            <div className="mb-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                         <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="text-blue-600" size={20} />
                            Sales History
                        </h3>
                        <p className="text-sm text-gray-500">Analyze performance for past dates</p>
                    </div>
                    <div>
                        <input 
                            type="date" 
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                            value={historyDate}
                            onChange={(e) => setHistoryDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]} 
                        />
                    </div>
                </div>

                {historyDate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {loadingHistory ? (
                             <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                             </div>
                        ) : historyStats ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Historical Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">Rs {historyStats.totalRevenue?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{historyStats.totalOrders || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Top Selling Item</p>
                                    <p className="text-base font-bold text-gray-900 truncate max-w-full px-2" title={historyStats.topItems?.[0]?._id}>
                                         {historyStats.topItems?.[0]?._id || "N/A"}
                                    </p>
                                    {historyStats.topItems?.[0] && (
                                        <p className="text-xs text-gray-400 mt-1">{historyStats.topItems[0].totalQuantity} sold</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 italic py-4">No data available for this date</p>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
                <h3 className="font-semibold text-lg text-gray-800 mb-6">Values Trends</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={chartData.length > 0 ? chartData : weeklyData}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `Rs ${val}`}/>
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Top Selling Items Chart */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 h-auto">
                <div className="flex flex-row flex-wrap justify-between items-center mb-6 gap-4">
                    <h3 className="font-semibold text-lg text-gray-800">Top Selling Items</h3>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-medium">TOTAL SOLD</p>
                        <p className="text-sm font-bold text-blue-600">
                            {stats.topItems?.reduce((acc: number, item: any) => acc + item.totalQuantity, 0) || 0} Items
                        </p>
                        <p className="text-xs text-gray-400">
                           Rs {stats.topItems?.reduce((acc: number, item: any) => acc + item.totalSales, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.topItems || []} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                             <XAxis type="number" hide />
                             <YAxis dataKey="_id" type="category" width={70} tick={{fill: '#4b5563', fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}} 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                itemStyle={{ color: '#2563eb' }}
                                formatter={(value: any, name: any) => [value, name === 'totalQuantity' ? 'Qty Sold' : 'Revenue']}
                            />
                            <Bar dataKey="totalQuantity" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Quantity">
                                <LabelList dataKey="totalQuantity" position="right" fill="#3b82f6" fontSize={12} formatter={(val: any) => `${val} sold`} />
                            </Bar>
                            <Bar dataKey="totalSales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Sales (Rs)">
                                <LabelList dataKey="totalSales" position="right" fill="#10b981" fontSize={12} formatter={(val: any) => `Rs ${val}`} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
}
