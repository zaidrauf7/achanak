"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Minus, Utensils, RefreshCw, Trash2 } from 'lucide-react';

interface Order {
    _id: string;
    tableNo?: string;
    totalAmount: number;
    status: string;
    items: any[];
}

export default function DineInPage() {
    const [totalTables, setTotalTables] = useState(12);
    const [activeTables, setActiveTables] = useState<Record<string, Order>>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Settings
        try {
            const settingsRes = await fetch('/api/settings');
            const settingsData = await settingsRes.json();
            if (settingsData.totalTables) setTotalTables(settingsData.totalTables);

            // Fetch ALL orders to determine true state
            const ordersRes = await fetch('/api/orders?limit=100&_t=' + Date.now(), { cache: 'no-store' });
            const ordersData = await ordersRes.json();
            
            if (Array.isArray(ordersData)) {
                const tables: Record<string, Order> = {};
                const processedTables = new Set<string>();

                // Sort by creation time (newest first) to ensure we check the latest status
                ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                // Group orders by table
                ordersData.forEach((o: Order) => {
                    if (!o.tableNo || processedTables.has(o.tableNo)) return;
                    
                    processedTables.add(o.tableNo);

                    // If the LATEST order for this table is pending, it's occupied.
                    // If the latest is completed, we do nothing (it remains available).
                    if (o.status === 'pending' || o.status === 'preparing') {
                        tables[o.tableNo] = o;
                    }
                });
                
                setActiveTables(tables);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateTableCount = async (change: number) => {
        const newCount = totalTables + change;
        if (newCount < 1) return;

        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ totalTables: newCount })
            });
            setTotalTables(newCount);
        } catch (err) {
            alert("Failed to update table count");
        }
    };

    const handleTableClick = (tableNum: string) => {
        const order = activeTables[tableNum];
        if (order) {
            // Go to edit existing order based on table
            router.push(`/create-order?edit=${order._id}`);
        } else {
            router.push(`/create-order?table=${tableNum}`);
        }
    };

    const handleForceFree = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to clear this table? This will permanently delete the active order.")) {
             await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
             fetchData();
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dine-In Management</h1>
                    <p className="text-gray-500 mt-1">Visual table layout and order status</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-600 px-2">Total Tables: {totalTables}</span>
                    <div className="flex gap-1">
                        <button 
                            onClick={fetchData}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                            title="Refresh Status"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button 
                            onClick={() => updateTableCount(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        >
                            <Minus size={16} />
                        </button>
                        <button 
                            onClick={() => updateTableCount(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading tables...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: totalTables }, (_, i) => String(i + 1)).map((num) => {
                        const order = activeTables[num];
                        const isOccupied = !!order;

                        return (
                            <button
                                key={num}
                                onClick={() => handleTableClick(num)}
                                className={`
                                    relative h-48 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group
                                    ${isOccupied 
                                        ? 'bg-white border-red-200 shadow-lg shadow-red-50 hover:border-red-300' 
                                        : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-lg hover:scale-[1.02]'
                                    }
                                `}
                            >
                                {/* Table Visual (Vector-like CSS) */}
                                <div className={`
                                    w-20 h-20 rounded-full border-4 flex items-center justify-center relative
                                    ${isOccupied ? 'border-red-100 bg-red-50 text-red-500' : 'border-gray-100 bg-gray-50 text-gray-400 group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-500'}
                                `}>
                                    {/* Chairs around */}
                                    <div className={`absolute -top-3 w-8 h-2 rounded-full ${isOccupied ? 'bg-red-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>
                                    <div className={`absolute -bottom-3 w-8 h-2 rounded-full ${isOccupied ? 'bg-red-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>
                                    <div className={`absolute -left-3 h-8 w-2 rounded-full ${isOccupied ? 'bg-red-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>
                                    <div className={`absolute -right-3 h-8 w-2 rounded-full ${isOccupied ? 'bg-red-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>
                                    
                                    <span className="text-2xl font-bold">{num}</span>
                                </div>

                                {/* Status Info */}
                                <div className="text-center">
                                    {isOccupied ? (
                                        <>
                                            <div className="text-sm font-bold text-gray-900">Occupied</div>
                                            <div className="text-xs text-red-500 font-medium mt-1">
                                                Rs {order.totalAmount.toFixed(2)} • {order.items.length} items
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm font-medium text-gray-400 group-hover:text-blue-500">Available</div>
                                    )}
                                </div>

                                {isOccupied && (
                                    <>
                                        <div className="absolute top-4 right-4 animate-pulse">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleForceFree(e, order._id)}
                                            className="absolute top-2 left-2 p-2 bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Force Free Table (Delete Order)"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </button>
                        );
                    })}
                    
                    {/* Add Table Ghost Button */}
                    <button
                        onClick={() => updateTableCount(1)}
                        className="h-48 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                        <Plus size={32} />
                        <span className="font-medium">Add Table</span>
                    </button>
                </div>
            )}
        </div>
    );
}
