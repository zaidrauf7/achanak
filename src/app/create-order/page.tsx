"use client";
import React, { useEffect, useState } from "react";
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from "@/components/ui/Loader";

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
      if (activeTables[num]) {
          // If table is occupied, go to edit that order
          if (activeTables[num] !== orderId) {
              if (confirm(`Table ${num} is occupied. Do you want to add items to the existing order?`)) {
                  router.push(`/create-order?edit=${activeTables[num]}`);
              }
          }
      } else {
          setTableNo(num);
      }
  };

  const submitOrder = async () => {
     if (orderType === 'dine-in' && !tableNo) {
         alert("Please select a table number for Dine In orders.");
         return;
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
         setCart([]);
         if (orderId) {
             router.push('/orders');
         } else {
             alert("Order placed successfully!");
             // Reset table selection if needed or keep it? Better reset for next customer.
             setTableNo("");
             // Refresh active tables
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
         }
     } else {
         console.error("Order submission failed");
         alert("Failed to submit order.");
     }
  };

  const categories = ["All", ...Array.from(new Set(menu.map(item => item.category)))];
  const filteredMenu = menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filter === "All" || item.category === filter;
      return matchesSearch && matchesCategory;
  });

  if (loading) {
      return <Loader fullScreen={false} className="h-screen" text="Loading menu..." />;
  }

  return (
    <div className="h-screen bg-white p-6 font-sans flex flex-col overflow-hidden">
       <header className="mb-6 flex justify-between items-center shrink-0">
           <div>
            <h1 className="text-2xl font-bold text-gray-900">{orderId ? 'Edit Order' : 'New Order'}</h1>
            <p className="text-gray-500">{orderId ? 'Modify items in this order' : 'Select items to add to the customer\'s bill'}</p>
           </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
           {/* Menu Section */}
           <div className="lg:col-span-2 flex flex-col h-full min-h-0">
               
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
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                        <span className="font-extrabold text-blue-600 text-xl">${item.price}</span>
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
           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 h-full flex flex-col overflow-hidden">
               <h2 className="font-bold text-xl mb-6 text-gray-800 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-2">
                       Current Order
                       {orderType === 'dine-in' && tableNo && (
                           <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200 ml-2">
                               Table {tableNo}
                           </span>
                       )}
                   </div>
                   <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-medium">{cart.length} items</span>
               </h2>

               {/* Order Type Toggle */}
               <div className="bg-gray-100 p-1 rounded-xl flex mb-4 shrink-0">
                   <button 
                       onClick={() => setOrderType('dine-in')}
                       className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${orderType === 'dine-in' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       Dine In
                   </button>
                   <button 
                       onClick={() => setOrderType('take-away')}
                       className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${orderType === 'take-away' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       Take Away
                   </button>
               </div>

               {orderType === 'dine-in' && (
                   <div className="mb-6 shrink-0">
                       <h3 className="text-sm font-bold text-gray-700 mb-3 ml-1">Select Table</h3>
                       <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                           {Array.from({ length: totalTables }, (_, i) => String(i + 1)).map((num) => {
                               const isOccupied = !!activeTables[num];
                               const isSelected = tableNo === num;
                               const isCurrentOrder = activeTables[num] === orderId;
                               
                               return (
                                   <button
                                       key={num}
                                       onClick={() => handleTableClick(num)}
                                       className={`
                                           h-10 rounded-lg text-sm font-bold border transition-all relative overflow-hidden
                                           ${isSelected 
                                               ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                               : isOccupied 
                                                   ? isCurrentOrder ? 'bg-blue-600 text-white border-blue-600' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                                                   : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                           }
                                       `}
                                   >
                                       {num}
                                       {isOccupied && !isCurrentOrder && (
                                           <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-1"></span>
                                       )}
                                   </button>
                               );
                           })}
                       </div>
                   </div>
               )}
               
               <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 min-h-0">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} className="opacity-50" />
                            </div>
                            <p>No items added yet</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.menuItem} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group">
                                <div>
                                    <div className="font-semibold text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-500 font-medium">${item.price} x {item.quantity}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button onClick={(e) => {e.stopPropagation(); removeFromCart(item.menuItem)}} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600">-</button>
                                        <button onClick={(e) => {e.stopPropagation(); addToCart({...item, _id: item.menuItem, category: ''})}} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600">+</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
               </div>

               <div className="pt-6 border-t border-gray-200 shrink-0">
                    <div className="flex justify-between mb-2 text-gray-500 text-sm">
                        <span>Subtotal</span>
                        <span>${cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-3xl text-gray-900 mb-6">
                       <span>Total</span>
                       <span>${cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                   </div>

                   <button 
                    onClick={submitOrder} 
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                   >
                       {orderId ? "Update Order" : "Place Order"}
                   </button>
               </div>
           </div>
       </div>
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
