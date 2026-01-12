"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';

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
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        // Fetch ALL orders
        fetch('/api/orders', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter to only show pending and completed (exclude cancelled if any, or show all)
                    // Sort: Pending first, then by date desc
                    const sorted = data.sort((a: Order, b: Order) => {
                        // Prioritize Pending
                        if (a.status === 'pending' && b.status !== 'pending') return -1;
                        if (a.status !== 'pending' && b.status === 'pending') return 1;
                        // Then by date desc
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    setOrders(sorted);
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
            fetchOrders(); // Refresh list
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
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Active Orders</h1>
                    <p className="text-gray-500 mt-1">Manage pending orders in the kitchen</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                    {orders.filter(o => o.status === 'pending').length} Pending
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Clock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
                    <p className="text-gray-500">New orders will appear here instantly.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Time</th>
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
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
