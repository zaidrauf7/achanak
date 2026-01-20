"use client";
import React, { useEffect, useState } from "react";
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface CartItem {
  menuItem: string; 
  name: string;
  price: number;
  quantity: number;
}

const CreateOrderContent = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [orderType, setOrderType] = useState("take-away");
  const [tableNo, setTableNo] = useState("");
  const [totalTables, setTotalTables] = useState(12);
  const [activeTables, setActiveTables] = useState<Record<string, string>>({}); // tableNo -> orderId
  const [showTableError, setShowTableError] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const orderId = searchParams.get('edit');
  const tableParam = searchParams.get('table');

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setMenu(Array.isArray(data) ? data : []); 
        setLoading(false);
      });

    // If table param is present, pre-select dine-in and table
    if (tableParam) {
        setOrderType('dine-in');
        setTableNo(tableParam);
    }

    // Fetch Settings (Total Tables)
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.totalTables) setTotalTables(data.totalTables);
        });

    // Fetch active tables to show status
    fetch('/api/orders?status=pending')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                const tables: Record<string, string> = {};
                data.forEach((o: any) => {
                    if (o.status === 'pending' && o.orderType === 'dine-in' && o.tableNo) {
                        tables[o.tableNo] = o._id;
                    }
                });
                setActiveTables(tables);
            }
        });

    // If editing, fetch existing order
    if (orderId) {
        fetch(`/api/orders/${orderId}`)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Failed to fetch order");
            })
            .then(data => {
                setCart(data.items || []);
                if (data.orderType) setOrderType(data.orderType);
                if (data.tableNo) setTableNo(data.tableNo);
            })
            .catch(err => {
                console.error(err);
                alert("Failed to load order for editing");
            });
    }
  }, [orderId, tableParam]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem === item._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };
  
  const removeFromCart = (id: string, removeAll: boolean = false) => {
      setCart(prev => {
          if (removeAll) return prev.filter(i => i.menuItem !== id);
          
          return prev.map(i => {
              if (i.menuItem === id) {
                  return {...i, quantity: i.quantity - 1};
              }
              return i;
          }).filter(i => i.quantity > 0);
      });
  }
  
  const handleTableClick = (num: string) => {
      setShowTableError(false);
      if (activeTables[num]) {
          // If table is occupied, go to edit that order
          if (activeTables[num] !== orderId) {
              if (confirm(`Table ${num} is occupied. Do you want to add items to the existing order?`)) {
                  router.push(`/create-order?edit=${activeTables[num]}`);
              } else {
                 setTableNo(""); // Canceled selection
              }
          }
      } else {
          setTableNo(num);
      }
  };

  const submitOrder = async (returnOrder = false) => {
     if (orderType === 'dine-in' && !tableNo) {
         setShowTableError(true);
         return null;
     }

     const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
     const orderData = {
         items: cart,
         totalAmount,
         status: "pending",
         orderType,
         tableNo: orderType === 'dine-in' ? tableNo : undefined
     };

     let res;
     if (orderId) {
         // Update existing order
         res = await fetch(`/api/orders/${orderId}`, {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(orderData)
         });
     } else {
         // Create new order
         res = await fetch("/api/orders", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(orderData)
         });
     }

     if (res.ok) {
         const data = await res.json();
         
         // If just returning order (for print), don't reset state immediately to allow caller to handle flow
         if (returnOrder) {
             // We still reset cart but return the data
             setCart([]);
             setTableNo("");
             // Refresh active tables
             refreshActiveTables();
             return data;
         }

         setCart([]);
         if (orderId) {
             router.push('/orders');
         } else {
             setToast({ message: "Order placed successfully!", type: "success" });
             setTableNo("");
             refreshActiveTables();
         }
         return data;
     } else {
         console.error("Order submission failed");
         setToast({ message: "Failed to submit order.", type: "error" });
         return null;
     }
  };

  const refreshActiveTables = () => {
      fetch('/api/orders?status=pending')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                const tables: Record<string, string> = {};
                data.forEach((o: any) => {
                    if (o.status === 'pending' && o.orderType === 'dine-in' && o.tableNo) {
                        tables[o.tableNo] = o._id;
                    }
                });
                setActiveTables(tables);
            }
        });
  };
   

  const categories = Array.from(new Set(["All", "Biryani", "Pulao", "Palak", "Dal", "Dessert", "Sides", "Drinks", ...menu.map(item => item.category)]));
  const filteredMenu = menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filter === "All" || item.category === filter;
      return matchesSearch && matchesCategory;
  });

  if (loading) {
      return <Loader fullScreen={false} className="h-screen" text="Loading menu..." />;
  }

  return (
    <div className="h-screen bg-white px-6 pt-6 font-sans flex flex-col overflow-hidden">
       

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
           {/* Menu Section */}
           <div className="lg:col-span-3 flex flex-col h-full min-h-0">
               
               {/* Search & Filter Bar */}
               <div className="mb-4 flex gap-4 shrink-0">
                   <div className="relative flex-1">
                       <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                       <input 
                         type="text" 
                         placeholder="Search menu..." 
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500"
                       />
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                       {categories.map(cat => (
                           <button 
                             key={cat}
                             onClick={() => setFilter(cat)}
                             className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                           >
                               {cat}
                           </button>
                       ))}
                   </div>
               </div>

               {/* Menu Grid */}
               <div className="flex-1 overflow-y-auto pr-2 pb-2">
                   <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                       {filteredMenu.map((item) => (
                           <button 
                             key={item._id} 
                             onClick={() => addToCart(item)}
                             className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-start text-left overflow-hidden h-64"
                           >
                               {/* Image Background */}
                               <div className="h-40 w-full relative overflow-hidden bg-gray-100">
                                   {item.image ? (
                                       <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center text-gray-300">
                                           <span className="text-4xl">🍛</span>
                                       </div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                   
                                   <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-800 uppercase tracking-wider shadow-sm">
                                       {item.category}
                                   </span>
                               </div>

                               {/* Content */}
                               <div className="p-4 w-full flex flex-col justify-between flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{item.name}</h3>
                                    <div className="flex justify-between items-center mt-2 w-full">
                                        <span className="font-extrabold text-blue-600 text-xl">Rs {item.price}</span>
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <span className="text-lg font-light">+</span>
                                        </div>
                                    </div>
                               </div>
                           </button>
                       ))}
                       {filteredMenu.length === 0 && (
                           <div className="col-span-3 text-center py-20 text-gray-400">
                               No items found matching your search.
                           </div>
                       )}
                   </div>
               </div>
           </div>

           {/* Cart Section */}
           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 h-full flex flex-col overflow-hidden">
               <h2 className="font-bold text-lg mb-4 text-gray-800 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-2">
                       Current Order
                       {orderType === 'dine-in' && tableNo && (
                           <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 ml-2">
                               Table {tableNo}
                           </span>
                       )}
                   </div>
                   <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-600 font-medium">{cart.length} items</span>
               </h2>

               {/* Order Type Toggle */}
               <div className="bg-gray-100 p-1 rounded-lg flex mb-3 shrink-0">
                   <button 
                       onClick={() => setOrderType('dine-in')}
                       className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${orderType === 'dine-in' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       Dine In
                   </button>
                   <button 
                       onClick={() => setOrderType('take-away')}
                       className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${orderType === 'take-away' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       Take Away
                   </button>
               </div>

               {orderType === 'dine-in' && (
                   <div className="mb-4 shrink-0">
                       <label className={`text-xs font-bold mb-1.5 ml-1 block ${showTableError ? 'text-red-500' : 'text-gray-700'}`}>Select Table <span className="text-red-500">*</span></label>
                       <div className="relative">
                            <select 
                                value={tableNo}
                                onChange={(e) => handleTableClick(e.target.value)}
                                className={`w-full p-2.5 bg-gray-50 border rounded-xl text-sm text-gray-700 focus:outline-none appearance-none font-medium transition-all hover:bg-white cursor-pointer ${showTableError ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
                            >
                                <option value="" disabled>Choose a table...</option>
                                {Array.from({ length: totalTables }, (_, i) => String(i + 1)).map((num) => {
                                    const isOccupied = !!activeTables[num];
                                    const isCurrentOrder = activeTables[num] === orderId;
                                    return (
                                        <option key={num} value={num} className={isOccupied && !isCurrentOrder ? "text-red-500 font-bold" : ""}>
                                            Table {num} {isOccupied && !isCurrentOrder ? '(Occupied)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${showTableError ? 'text-red-500' : 'text-gray-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                       </div>
                       {showTableError && <p className="text-[10px] text-red-500 mt-1 font-bold ml-1">Please select a table to proceed.</p>}
                   </div>
               )}
               
               <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3 min-h-0">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                                <Search size={20} className="opacity-50" />
                            </div>
                            <p className="text-sm">No items added yet</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.menuItem} className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center group">
                                <div>
                                    <div className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{item.name}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">Rs {item.price} x {item.quantity}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 text-sm">Rs {(item.price * item.quantity).toFixed(2)}</span>
                                    <div className="flex items-center bg-gray-100 rounded-md p-0.5">
                                        <button onClick={(e) => {e.stopPropagation(); removeFromCart(item.menuItem)}} className="w-5 h-5 flex items-center justify-center hover:bg-white rounded text-gray-600 text-xs">-</button>
                                        <button onClick={(e) => {e.stopPropagation(); addToCart({...item, _id: item.menuItem, category: ''})}} className="w-5 h-5 flex items-center justify-center hover:bg-white rounded text-gray-600 text-xs">+</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
               </div>

               <div className="pt-4 border-t border-gray-200 shrink-0">
                    <div className="flex justify-between mb-1 text-gray-500 text-xs">
                        <span>Subtotal</span>
                        <span>Rs {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-2xl text-gray-900 mb-4">
                       <span>Total</span>
                       <span>Rs {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                   </div>

                   <div className="grid grid-cols-4 gap-2">
                       <button 
                        onClick={() => submitOrder(false)} 
                        disabled={cart.length === 0}
                        className="col-span-2 py-3 text-sm bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                       >
                           {orderId ? "Update Order" : "Place Order"}
                       </button>
                       <button
                           onClick={async () => {
                               // Capture cart snapshot before submit clears it
                               const cartSnapshot = [...cart];
                               const total = cartSnapshot.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2);
                               const date = new Date().toLocaleString();
                               
                               // Open window first to avoid popup blocker logic
                               const win = window.open('', '', 'width=400,height=600');
                               if(win) win.document.write('<html><body><h3>Processing Order...</h3></body></html>');

                               // Submit Order
                               const savedOrder = await submitOrder(true);
                               
                               if (!savedOrder) {
                                   win?.close();
                                   return; 
                               }
                               
                               const finalOrderId = savedOrder._id || orderId || 'New';

                               const receiptHtml = `
                                   <html>
                                       <head>
                                           <title>Print Receipt</title>
                                           <style>
                                               body { font-family: 'Courier New', monospace; text-align: center; max-width: 300px; margin: 0 auto; padding: 20px; }
                                               .header { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                                               .title { font-size: 20px; font-weight: bold; margin: 0; }
                                               .subtitle { font-size: 12px; }
                                               .meta { text-align: left; font-size: 12px; margin-bottom: 10px; }
                                               .items { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
                                               .items th { border-bottom: 1px dashed #000; text-align: left; }
                                               .items td { padding: 4px 0; }
                                               .total { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; font-size: 16px; text-align: right; }
                                               .footer { margin-top: 20px; font-size: 12px; }
                                           </style>
                                       </head>
                                       <body>
                                           <div class="header">
                                               <h1 class="title">Achanak</h1>
                                               <p class="subtitle">Authentic Flavors</p>
                                           </div>
                                           <div class="meta">
                                               <div>Date: ${date}</div>
                                               <div>Type: ${orderType === 'dine-in' ? 'Dine In' : 'Take Away'}</div>
                                               ${orderType === 'dine-in' && tableNo ? `<div>Table: ${tableNo}</div>` : ''}
                                               <div>Order #: ${finalOrderId.slice(-4)}</div>
                                           </div>
                                           <table class="items">
                                               <thead>
                                                   <tr>
                                                       <th>Item</th>
                                                       <th>Qty</th>
                                                       <th style="text-align:right">Price</th>
                                                   </tr>
                                               </thead>
                                               <tbody>
                                                   ${cartSnapshot.map(item => `
                                                       <tr>
                                                           <td>${item.name}</td>
                                                           <td>${item.quantity}</td>
                                                           <td style="text-align:right">Rs ${(item.price * item.quantity).toFixed(2)}</td>
                                                       </tr>
                                                   `).join('')}
                                               </tbody>
                                           </table>
                                           <div class="total">
                                               Total: Rs ${total}
                                           </div>
                                           <div class="footer">
                                               <p>Thank you for visiting!</p>
                                           </div>
                                           <script>
                                               window.onload = function() { window.print(); window.close(); }
                                           </script>
                                       </body>
                                   </html>
                               `;
                               if (win) {
                                   win.document.body.innerHTML = ''; // Clear loading message
                                   win.document.write(receiptHtml);
                                   win.document.close();
                               }
                               
                               if (orderId) {
                                    router.push('/orders'); // Redirect if editing
                               }
                           }}
                           disabled={cart.length === 0}
                           className="col-span-2 py-3 text-sm bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 border border-gray-200"
                       >
                           <span className="text-xl">🖨️</span>
                           <span className="text-[10px] uppercase tracking-wide">{orderId ? "Update & Print" : "Place & Print"}</span>
                       </button>
                   </div>
               </div>
           </div>
       </div>
       {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function CreateOrderPage() {
    return (
        <React.Suspense fallback={<Loader fullScreen />}>
            <CreateOrderContent />
        </React.Suspense>
    );
}
