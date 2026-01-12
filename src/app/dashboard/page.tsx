"use client";
import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, topItems: [] });
  const [tableStats, setTableStats] = useState({ total: 0, occupied: 0 });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Fetch Sales Stats
    fetch("/api/sales")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });

    // Fetch Table Stats
    Promise.all([
        fetch('/api/settings').then(res => res.json()),
        fetch('/api/orders?status=pending').then(res => res.json())
    ]).then(([settings, orders]) => {
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

  // Sync the chart "Today" value with actual data
  if (stats.totalRevenue > 0) {
      weeklyData[6].sales = stats.totalRevenue;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Today's Sales</h1>
            <p className="text-gray-500 mt-1">Real-time overview for <span className="font-semibold text-blue-600">{new Date().toLocaleDateString()}</span></p>
        </header>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Total Revenue</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">Total cash collected today</div>
            </div>
            
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Orders Served</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-gray-900">{stats.totalOrders}</span>
                     <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                 <div className="mt-2 text-xs text-gray-400">Total bills generated today</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Avg. Ticket Size</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-gray-900">
                         ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : "0.00"}
                     </span>
                </div>
                 <div className="mt-2 text-xs text-gray-400">Average spend per customer</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Table Status</h3>
                <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-red-600">{tableStats.occupied}</span>
                     <span className="text-xl font-medium text-gray-400">/ {tableStats.total}</span>
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tableStats.occupied > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                    {tableStats.occupied > 0 ? 'Tables Occupied Now' : 'All Tables Available'}
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full opacity-50"></div>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
                <h3 className="font-semibold text-lg text-gray-800 mb-6">Weekly Revenue Trend</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={weeklyData}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `$${val}`}/>
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
                           ${stats.topItems?.reduce((acc: number, item: any) => acc + item.totalSales, 0).toLocaleString()}
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
                            <Bar dataKey="totalSales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Sales ($)">
                                <LabelList dataKey="totalSales" position="right" fill="#10b981" fontSize={12} formatter={(val: any) => `$${val}`} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
}
