"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import Loader from "@/components/ui/Loader";

interface OrderItem {
    menuItem: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
    status: string;
    orderType?: string;
    createdAt: string;
}

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchOrders();
    }, [activeTab, dateRange]);

    const fetchOrders = () => {
        setLoading(true);
        let url = '/api/orders?';
        
        if (activeTab === 'active') {
            // Fetching all for active to ensure we catch everything not completed/cancelled
            // Optimally we'd filter on server, but for now we filter client side after fetching all
            // Or better, let's just fetch pending and preparing if we update API. 
            // Current API supports single status. Let's fetch ALL and filter since active lists are small.
             url = '/api/orders'; 
        } else {
             url = '/api/orders?status=completed';
             if (dateRange.start) url += `&startDate=${dateRange.start}`;
             if (dateRange.end) url += `&endDate=${dateRange.end}`;
        }

        fetch(url, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    let filtered = data;
                    if (activeTab === 'active') {
                        filtered = data.filter(o => o.status === 'pending' || o.status === 'preparing');
                        // Sort by Pending first, then time
                        filtered.sort((a, b) => {
                             if (a.status === 'pending' && b.status !== 'pending') return -1;
                             if (a.status !== 'pending' && b.status === 'pending') return 1;
                             return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Oldest first for active (FIFO)
                        });
                    } else {
                        // Completed orders: Newest first
                         filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    }
                    setOrders(filtered);
                } else {
                    setOrders([]);
                }
                setLoading(false);
            });
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const res = await fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            fetchOrders(); 
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        
        const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchOrders();
        }
    };

    const handleEdit = (order: Order) => {
        router.push(`/create-order?edit=${order._id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <header className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {activeTab === 'active' ? 'Active Orders' : 'Order History'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {activeTab === 'active' ? 'Manage pending orders in the kitchen' : 'View past completed orders'}
                        </p>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => { setActiveTab('active'); setDateRange({start:'', end:''}); }}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Active Orders
                        </button>
                        <button 
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Completed
                        </button>
                    </div>

                    {activeTab === 'completed' && (
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Date Range:</span>
                                <input 
                                    type="date" 
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                                    className="bg-transparent text-sm text-gray-700 focus:outline-none w-32"
                                />
                                <span className="text-gray-300">-</span>
                                <input 
                                    type="date" 
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                                    className="bg-transparent text-sm text-gray-700 focus:outline-none w-32"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {loading ? (
                <Loader fullScreen={false} className="h-64" text="Loading orders..." />
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Clock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
                    <p className="text-gray-500">
                        {activeTab === 'active' ? 'New orders will appear here instantly.' : 'No completed orders found for this period.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">#{order._id.slice(-4)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 max-w-xs">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="text-sm text-gray-700 truncate">
                                                        <span className="font-bold mr-1">{item.quantity}x</span> 
                                                        {item.name}
                                                    </div>
                                                ))}
                                                {(order.items?.length || 0) > 3 && (
                                                    <span className="text-xs text-gray-400 italic">+{order.items.length - 3} more...</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.orderType === 'take-away' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    🛍️ Take Away
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                                    🍽️ Dine In
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {order.status !== 'completed' && (
                                                    <button 
                                                        onClick={() => handleEdit(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={14} /> Edit
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    onClick={() => handleDelete(order._id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                                
                                                {order.status !== 'completed' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(order._id, 'completed')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle size={14} /> Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
