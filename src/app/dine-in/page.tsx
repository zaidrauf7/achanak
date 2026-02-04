"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Minus, Utensils, RefreshCw, Trash2, Printer, X, CheckCircle } from 'lucide-react';
import Toast from "@/components/ui/Toast";

interface Order {
    _id: string;
    tableNo?: string;
    totalAmount: number;
    subTotal?: number;
    discount?: number;
    status: string;
    items: any[];
    orderNumber?: number;
    createdAt?: string;
    orderType?: string;
}

export default function DineInPage() {
    const [totalTables, setTotalTables] = useState(12);
    const [activeTables, setActiveTables] = useState<Record<string, Order>>({});
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
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
            setToast({ message: "Table count updated", type: "success" });
        } catch (err) {
            setToast({ message: "Failed to update table count", type: "error" });
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

    const handleMarkPaid = async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            if (res.ok) {
                setSelectedOrder(null);
                setToast({ message: "Order marked as paid", type: "success" });
                fetchData();
            } else {
                setToast({ message: "Failed to mark order as paid", type: "error" });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: "An error occurred", type: "error" });
        }
    };

    const handlePrint = (order: Order) => {
        const subTotal = order.subTotal || order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        const discountVal = order.discount || 0;
        const discountPercent = discountVal > 0 ? ((discountVal / subTotal) * 100).toFixed(0) : 0;
        const finalTotal = order.totalAmount.toFixed(2);
        const date = new Date(order.createdAt || Date.now()).toLocaleString();
        
        const win = window.open('', '', 'width=400,height=600');
        
        const css = `
            * { box-sizing: border-box; }
            body { font-family: sans-serif, monospace; font-size: 13px; font-weight: bold; margin: 0; padding: 2px; width: 100%; color: #000; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: 900; }
            .header { margin-bottom: 5px; }
            .store-name { font-size: 19px; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; }
            .address { font-size: 9px; margin-bottom: 3px; line-height: 1.1; font-weight: 600; }
            .contact { font-size: 9px; font-weight: 900; margin-bottom: 10px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .order-no { font-size: 16px; font-weight: 900; margin: 5px 0; text-align: center; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: 9px; font-weight: 900; }
            .items-table td { padding: 3px 0; vertical-align: top; font-size: 9px; font-weight: bold; }
            .dotted-line { border-bottom: 1px dashed #000; margin: 3px 0; }
            .totals { margin-top: 5px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px; font-weight: bold; }
            .grand-total { font-size: 15px; font-weight: 900; margin-top: 3px; }
            .footer { margin-top: 15px; text-align: center; font-size: 8px; font-weight: bold; }
        `;

        const html = `
            <html>
                <head><title>Print Receipt</title><style>${css}</style></head>
                <body>
                    <div class="header text-center">
                        <div class="store-name">ACHANAK FOODS</div>
                        <div class="address">H72M+H72, C Block Block C Gulshan-e-<br>Ravi, Lahore, Punjab 54000</div>
                        <div class="contact">Contact # 03236060340</div>
                    </div>
                    <div class="meta-row">
                        <div><span class="bold">Invoice #</span> ${new Date(order.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')}-${order.orderNumber}</div>
                        <div class="text-right">
                            <div style="font-size: 10px; color: #000000;">Punched By</div>
                            <div class="bold">Mr.Nadeem</div>
                        </div>
                    </div>
                    <div class="meta-row">
                        <div><span class="bold">Date:</span> ${date}</div>
                    </div>
                    <div class="order-no">Order # ${order.orderNumber || order._id.slice(-4)}</div>
                    <div class="meta-row bold" style="margin-bottom: 15px;">
                         <div>Order Type:</div>
                         <div>Dine In (${order.tableNo})</div>
                    </div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 45%;">Product</th>
                                <th style="width: 15%; text-align: center;">Qty</th>
                                <th style="width: 20%; text-align: right;">Rate</th>
                                <th style="width: 20%; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td class="item-name">${item.name}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">${item.price.toFixed(2)}</td>
                                    <td style="text-align: right;">${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                                <tr><td colspan="4" style="border-bottom: 1px solid #30303065;"></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="totals">
                        <div class="dotted-line"></div>
                        <div class="total-row bold">
                            <span>Subtotal:</span>
                            <span>${subTotal.toFixed(2)}</span>
                        </div>
                        ${discountVal > 0 ? `
                            <div class="total-row" style="font-size: 9px;">
                                 <span>Discount ${discountPercent ? `(${discountPercent}%)` : ''}:</span>
                                 <span>-${discountVal.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="dotted-line"></div>
                        <div class="total-row grand-total">
                            <span>Grand Total:</span>
                            <span>${finalTotal}</span>
                        </div>
                        <div class="dotted-line"></div>
                    </div>
                    <div style="text-align: center; margin-top: 10px;">Thank you for your order!</div>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>`;
        
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

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
                            <div
                                key={num}
                                onClick={() => handleTableClick(num)}
                                className={`
                                    relative h-48 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group cursor-pointer
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
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOrder(order);
                                            }}
                                            className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all scale-90 sm:scale-100"
                                            title="View & Print Bill"
                                        >
                                            <Printer size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
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

            {/* Sidebar Backdrop */}
            {selectedOrder && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setSelectedOrder(null)}
                />
            )}

            {/* Sidebar Content */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${selectedOrder ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                {selectedOrder && (
                    <>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Utensils size={20} className="text-blue-500" />
                                Table {selectedOrder.tableNo} Bill
                            </h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex p-4 gap-2 border-b border-gray-100 shrink-0">
                            <button 
                                onClick={() => handleMarkPaid(selectedOrder._id)}
                                className="flex-1 bg-[#4c1d95] text-white py-2 rounded-md text-xs font-bold hover:bg-[#2e1065] transition-all shadow-sm active:scale-95"
                            >
                                Mark Paid
                            </button>
                            <button 
                                onClick={() => handlePrint(selectedOrder)}
                                className="flex-1 bg-[#3b82f6] text-white py-2 rounded-md text-xs font-bold hover:bg-[#2563eb] transition-all shadow-sm active:scale-95"
                            >
                                Print
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            <div className="text-gray-800 max-w-sm mx-auto">
                                <div className="text-center mb-4">
                                    <h3 className="font-bold text-lg">ACHANAK FOODS</h3>
                                    <p className="text-[10px] text-gray-600 leading-tight">H72M+H72, C Block Block C Gulshan-e-<br/>Ravi, Lahore, Punjab 54000</p>
                                    <p className="text-[10px] text-gray-600">Contact # 03236060340</p>
                                </div>

                                <div className="space-y-1 text-[11px] mb-4">
                                    <div className="flex justify-between">
                                        <span>Invoice # {new Date(selectedOrder.createdAt || "").toISOString().slice(0, 10).replace(/-/g, '')}{selectedOrder.orderNumber}</span>
                                        <div className="text-right">
                                            <div className="text-[9px]">OT</div>
                                            <div className="font-bold">Mr. Nadeem</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date: {new Date(selectedOrder.createdAt || "").toLocaleString()}</span>
                                    </div>
                                    <div className="text-center py-2">
                                        <div className="font-bold text-sm">Order # {selectedOrder.orderNumber}</div>
                                        <div className="text-[10px]">T{selectedOrder.tableNo} Hall1</div>
                                    </div>
                                </div>

                                <table className="w-full text-[11px] border-b border-gray-300">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-left">
                                            <th className="py-1">Order Type:</th>
                                            <th className="py-1 text-right">Dinein</th>
                                        </tr>
                                        <tr className="text-gray-600">
                                            <th className="py-1 font-medium">Product</th>
                                            <th className="py-1 text-center font-medium">Qty</th>
                                            <th className="py-1 text-right font-medium">Rate</th>
                                            <th className="py-1 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedOrder.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="py-2 text-gray-700">{item.name}</td>
                                                <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                                                <td className="py-2 text-right text-gray-600">{item.price.toFixed(2)}</td>
                                                <td className="py-2 text-right font-medium text-gray-900">{(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-4 space-y-1 text-[11px]">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{(selectedOrder.subTotal || selectedOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed border-gray-200 pt-1">
                                        <span className="font-bold">Grand Total:</span>
                                        <span className="font-bold">{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 text-center border-t border-gray-100 pt-4">
                                    <p className="text-[10px] text-gray-400">Powered by: Core Logics</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
