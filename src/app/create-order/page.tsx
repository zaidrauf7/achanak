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
  const [filter, setFilter] = useState("Chicken Biryani");
  const [orderType, setOrderType] = useState("take-away");
  const [tableNo, setTableNo] = useState("");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [totalTables, setTotalTables] = useState(12);
  const [activeTables, setActiveTables] = useState<Record<string, string>>({}); // tableNo -> orderId
  const [showTableError, setShowTableError] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [kitchenPrinted, setKitchenPrinted] = useState(false);
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
                setKitchenPrinted(data.kitchenPrinted || false);
                if (data.orderType) setOrderType(data.orderType);
                if (data.tableNo) setTableNo(data.tableNo);
            })
            .catch(err => {
                console.error(err);
                alert("Failed to load order for editing");
            });
    } else {
        // Reset for new order
        setCart([]);
        setTableNo(tableParam || "");
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

  const submitOrder = async (returnOrder = false, isKitchen = false) => {
     if (orderType === 'dine-in' && !tableNo) {
         setShowTableError(true);
         return null;
     }
     const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
     const discountValue = Number(discountAmount) || 0;
     const totalAmount = Math.max(0, subTotal - discountValue);

     const orderData = {
         items: cart,
         totalAmount,
         subTotal,
         discount: discountValue,
         status: "pending",
         orderType,
         tableNo: orderType === 'dine-in' ? tableNo : undefined,
         kitchenPrinted: isKitchen || kitchenPrinted
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
             setDiscountPercent("");
             setDiscountAmount("");
             setKitchenPrinted(false);
             // Refresh active tables
             refreshActiveTables();
             return data;
         }

         setCart([]);
         setDiscountPercent("");
         setDiscountAmount("");
         setKitchenPrinted(false);
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
   

  const categories = Array.from(new Set([

    "Chicken Biryani",
    "Daal Chawal", 
    "Chicken Pulao", 
    "Daal",
    "BEEF Pulao", 
    "Drinks", 
    "Raita + Salad", 
    "Palak Chawal", 
    "Zarda", 
    ...menu.map(item => {
        const cat = item.category ? item.category.trim() : "";
        if (cat === "Dessert") return "Zarda";
        if (cat === "Biryani") return "Chicken Biryani";
        if (cat === "Daal") return "Daal Chawal";
        if (cat === "Pulao") return "Chicken Pulao";
        if (cat === "Sides") return "Raita + Salad";
        return cat;
    }).filter(Boolean)
  ]));
  const filteredMenu = menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filter === "All" || 
                              filter === "All Products" || 
                              item.category === filter || 
                              (filter === "Zarda" && item.category === "Dessert") ||
                              (filter === "Chicken Biryani" && item.category === "Biryani") ||
                              (filter === "Daal Chawal" && item.category === "Daal") ||
                              (filter === "Chicken Pulao" && item.category === "Pulao") ||
                              (filter === "Raita + Salad" && item.category === "Sides");
      return matchesSearch && matchesCategory;
  }).sort((a, b) => b.price - a.price);

  if (loading) {
      return <Loader fullScreen={false} className="h-screen" text="Loading menu..." />;
  }

  return (
    <div className="h-screen bg-white px-3 pt-6 font-sans flex flex-col overflow-hidden">
       

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
           {/* Menu Section */}
           <div className="lg:col-span-3 flex flex-col h-full min-h-0">
               
               {/* Search & Filter Bar */}
               <div className="mb-1 flex flex-col gap-2 shrink-0">
                   <div className="flex gap-1">
                    <div className="relative flex-1">
                       <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                       <input 
                         type="text" 
                         placeholder="Search menu..." 
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500"
                       />
                   </div>
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                       {categories.map(cat => (
                           <button 
                             key={cat}
                             onClick={() => setFilter(cat)}
                             className={`px-2 border-purple-500 border-1 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                           >
                               {cat}
                           </button>
                       ))}
                   </div>
               </div>

               {/* Menu Grid */}
               <div className="flex-1 overflow-y-auto pr-2 pb-2">
                   <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
                       {filteredMenu.map((item) => (
                           <button 
                             key={item._id} 
                             onClick={() => addToCart(item)}
                             className="group relative bg-white rounded-xl shadow-sm border border-gray-100  hover:scale-[1.02] transition-all flex flex-col items-start text-left overflow-hidden h-36 "
                           >
                               {/* Image Background */}
                               <div className="h-18 w-full relative overflow-hidden bg-gray-100">
                                   {item.image ? (
                                       <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 object-center" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center text-gray-300">
                                           <span className="text-4xl">🍛</span>
                                       </div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                   
                                   {/* <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-800 uppercase tracking-wider shadow-sm">
                                       {item.category}
                                   </span> */}
                               </div>

                               {/* Content */}
                               <div className="p-2 w-full flex flex-col justify-between flex-1">
                                    <h3 className="font-bold text-gray-900 text-xs  leading-tight line-clamp-2">{item.name}</h3>
                                    <div className="flex justify-between items-center mt-1 w-full">
                                        <span className="font-extrabold text-blue-600 text-md"> {item.price.toFixed(2)}</span>
                                        {/* <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <span className="text-lg font-light">+</span>
                                        </div> */}
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
               
               <div className="flex-1 overflow-y-auto pr-1 mb-3 min-h-0">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                                <Search size={20} className="opacity-50" />
                            </div>
                            <p className="text-sm">No items added yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                                    <th className="py-2 font-medium pl-1">Item</th>
                                    <th className="py-2 font-medium text-center">Qty</th>
                                    <th className="py-2 font-medium text-center">Disc</th>
                                    <th className="py-2 font-medium text-right pr-1">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item) => (
                                    <tr key={item.menuItem} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors group">
                                        <td className="py-2 pl-1 max-w-[120px]">
                                             <div className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</div>
                                        </td>
                                        <td className="py-2">
                                            <div className="flex items-center justify-center bg-gray-100 rounded-md p-0.5 gap-1 w-fit mx-auto">
                                                <button onClick={(e) => {e.stopPropagation(); removeFromCart(item.menuItem)}} className="w-5 h-5 flex items-center justify-center hover:bg-white rounded shadow-sm text-gray-600 text-[10px] font-bold transition-all">-</button>
                                                <span className="text-xs font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                                                <button onClick={(e) => {e.stopPropagation(); addToCart({...item, _id: item.menuItem, category: ''})}} className="w-5 h-5 flex items-center justify-center hover:bg-white rounded shadow-sm text-gray-600 text-[10px] font-bold transition-all">+</button>
                                            </div>
                                        </td>
                                        <td className="py-2 text-center text-xs text-gray-400">
                                            0
                                        </td>
                                        <td className="py-2 text-right font-bold text-gray-900 text-sm pr-1">
                                            {(item.price * item.quantity).toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
               </div>

                <div className="pt-4 border-t border-gray-200 shrink-0">
                    <div className="flex justify-between mb-2 text-gray-500 text-xs font-medium">
                        <span>Items Count: {cart.length}</span>
                        <span>Subtotal: {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-500 block mb-1">Dis %</label>
                            <input 
                                type="number" 
                                min="0"
                                max="100"
                                value={discountPercent} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDiscountPercent(val);
                                    const subTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                    if (!val) {
                                        setDiscountAmount("");
                                    } else {
                                        const amount = (subTotal * parseFloat(val)) / 100;
                                        setDiscountAmount(amount.toFixed(2));
                                    }
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-500 block mb-1">Dis</label>
                            <input 
                                type="number" 
                                min="0" 
                                value={discountAmount} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDiscountAmount(val);
                                    const subTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                    if (!val) {
                                        setDiscountPercent("");
                                    } else {
                                        const percent = (parseFloat(val) / subTotal) * 100;
                                        setDiscountPercent(percent.toFixed(2));
                                    }
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-900 text-white p-3 rounded-xl flex justify-between items-center mb-4 shadow-lg shadow-gray-200">
                       <span className="font-bold">Grand Total</span>
                       <span className="font-bold text-xl">Rs {Math.max(0, cart.reduce((acc, i) => acc + (i.price * i.quantity), 0) - (Number(discountAmount) || 0)).toFixed(2)}</span>
                   </div>

                   <div className="grid grid-cols-5 gap-2">
                       <button
                           onClick={async () => {
                               const cartSnapshot = [...cart];
                               const subTotal = cartSnapshot.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                               const discountVal = Number(discountAmount) || 0;
                               const finalTotal = Math.max(0, subTotal - discountVal).toFixed(2);
                               const date = new Date().toLocaleString();
                               
                               const win = window.open('', '', 'width=400,height=600');
                               if(win) win.document.write('<html><body><h3>Processing...</h3></body></html>');

                               const savedOrder = await submitOrder(true);
                               if (!savedOrder) { win?.close(); return; }
                               
                               const finalOrderId = savedOrder._id || orderId || 'New';

                               const css = `
                                   * { box-sizing: border-box; }
                                   body { font-family: sans-serif, monospace; font-size: 15px; font-weight: bold; margin: 0; padding: 2px; width: 100%; color: #000; }
                                   .text-center { text-align: center; }
                                   .text-right { text-align: right; }
                                   .text-left { text-align: left; }
                                   .bold { font-weight: 900; }
                                   .header { margin-bottom: 5px; }
                                   .store-name { font-size: 21px; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; }
                                   .address { font-size: 13px; margin-bottom: 3px; line-height: 1.1; font-weight: 600; }
                                   .contact { font-size: 13px; font-weight: 900; margin-bottom: 10px; }
                                   .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                                   .order-no { font-size: 18px; font-weight: 900; margin: 5px 0; text-align: center; }
                                   .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                                   .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: 13px; font-weight: 900; }
                                   .items-table td { padding: 3px 0; vertical-align: top; font-size: 13px; font-weight: bold; }
                                   .dotted-line { border-bottom: 1px dashed #000; margin: 3px 0; }
                                   .totals { margin-top: 5px; }
                                   .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 14px; font-weight: bold; }
                                   .grand-total { font-size: 17px; font-weight: 900; margin-top: 3px; }
                                   .footer { margin-top: 15px; text-align: center; font-size: 10px; font-weight: bold; }
                                   .page-break { page-break-before: always; border-top: 1px dashed #000; margin-top: 15px; padding-top: 10px; }
                               `;

                               const getCustomerHtml = () => `
                                   <div class="header text-center">
                                       <div class="store-name">ACHANAK FOODS</div>
                                       <div class="address">H72M+H72, C Block Block C Gulshan-e-<br>Ravi, Lahore, Punjab 54000</div>
                                       <div class="contact">Contact # 03236060340</div>
                                   </div>
                                   <div class="meta-row">
                                       <div><span class="bold">Invoice #</span> ${finalOrderId.slice(-6).toUpperCase()}</div>
                                       <div class="text-right">
                                           <div style="font-size: 12px; color: #000000;">Punched By</div>
                                           <div class="bold">Mr.Nadeem</div>
                                       </div>
                                   </div>
                                   <div class="meta-row">
                                       <div><span class="bold">Date:</span> ${date}</div>
                                   </div>
                                   <div class="order-no">Order # ${finalOrderId.slice(-4)}</div>
                                   <div class="meta-row bold" style="margin-bottom: 15px;">
                                        <div>Order Type:</div>
                                        <div>${orderType === 'dine-in' ? `Dine In (${tableNo})` : 'TakeAway'}</div>
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
                                           ${cartSnapshot.map(item => `
                                               <tr>
                                                   <td class="item-name">${item.name}</td>
                                                   <td style="text-align: center;">${item.quantity}</td>
                                                   <td style="text-align: right;">${item.price.toFixed(2)}</td>
                                                   <td style="text-align: right;">${(item.price * item.quantity).toFixed(2)}</td>
                                               </tr>
                                               <tr><td colspan="4" style="border-bottom: 1px solid #000;"></td></tr>
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
                                           <div class="total-row" style="font-size: 11px;">
                                                <span>Discount ${discountPercent ? `(${Number(discountPercent).toFixed(0)}%)` : ''}:</span>
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
                               `;

                               const receiptHtml = `
                                   <html>
                                       <head><title>Print Receipt</title><style>${css}</style></head>
                                       <body>${getCustomerHtml()}<script>window.onload = function() { window.print(); window.close(); }</script></body>
                                   </html>`;
                               
                               if (win) { win.document.body.innerHTML = ''; win.document.write(receiptHtml); win.document.close(); }
                               if (orderId) { router.push('/orders'); }
                           }} 
                           disabled={cart.length === 0}
                           className="col-span-2 py-2 text-xs    bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                       >
                           {orderId ? "Update & Print" : "Print Order"}
                       </button>
                       <button
                           onClick={async () => {
                               const cartSnapshot = [...cart];
                               const subTotal = cartSnapshot.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                               const discountVal = Number(discountAmount) || 0;
                               const finalTotal = Math.max(0, subTotal - discountVal).toFixed(2);
                               const date = new Date().toLocaleString();
                               
                               const win = window.open('', '', 'width=400,height=600');
                               if(win) win.document.write('<html><body><h3>Processing...</h3></body></html>');

                               const savedOrder = await submitOrder(true, true);
                               if (!savedOrder) { win?.close(); return; }
                               // State is reset inside submitOrder for new session
                               
                               const finalOrderId = savedOrder._id || orderId || 'New';

                               const css = `
                                   * { box-sizing: border-box; }
                                   body { font-family: sans-serif, monospace; font-size: 15px; font-weight: bold; margin: 0; padding: 2px; width: 100%; color: #000; }
                                   .text-center { text-align: center; }
                                   .text-right { text-align: right; }
                                   .text-left { text-align: left; }
                                   .bold { font-weight: 900; }
                                   .header { margin-bottom: 5px; }
                                   .store-name { font-size: 21px; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; }
                                   .address { font-size: 13px; margin-bottom: 3px; line-height: 1.1; font-weight: 600; }
                                   .contact { font-size: 13px; font-weight: 900; margin-bottom: 10px; }
                                   .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                                   .order-no { font-size: 18px; font-weight: 900; margin: 5px 0; text-align: center; }
                                   .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                                   .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: 13px; font-weight: 900; }
                                   .items-table td { padding: 3px 0; vertical-align: top; font-size: 13px; font-weight: bold; }
                                   .dotted-line { border-bottom: 1px dashed #000; margin: 3px 0; }
                                   .totals { margin-top: 5px; }
                                   .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 14px; font-weight: bold; }
                                   .grand-total { font-size: 17px; font-weight: 900; margin-top: 3px; }
                                   .footer { margin-top: 15px; text-align: center; font-size: 10px; font-weight: bold; }
                                   .page-break { page-break-before: always; border-top: 1px dashed #000; margin-top: 15px; padding-top: 10px; }
                               `;

                               const getKitchenHtml = () => `
                                   <div class="header text-center">
                                       <div class="store-name">KITCHEN TOKEN</div>
                                   </div>
                                   <div class="meta-row">
                                       <div><span class="bold">Date:</span> ${date}</div>
                                   </div>
                                   <div class="order-no">Order # ${finalOrderId.slice(-4)}</div>
                                   <div class="meta-row bold" style="margin-bottom: 15px;">
                                        <div>Order Type:</div>
                                        <div>${orderType === 'dine-in' ? `Dine In (${tableNo})` : 'TakeAway'}</div>
                                   </div>
                                   <table class="items-table">
                                       <thead>
                                           <tr>
                                               <th style="width: 80%;">Product</th>
                                               <th style="width: 20%; text-align: center;">Qty</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                           ${cartSnapshot.map(item => `
                                               <tr>
                                                   <td class="item-name">${item.name}</td>
                                                   <td style="text-align: center;">${item.quantity}</td>
                                               </tr>
                                               <tr><td colspan="2" style="border-bottom: 1px solid #000;"></td></tr>
                                           `).join('')}
                                       </tbody>
                                   </table>
                               `;

                               const receiptHtml = `
                                   <html>
                                       <head><title>Kitchen Print</title><style>${css}</style></head>
                                       <body>${getKitchenHtml()}<script>window.onload = function() { window.print(); window.close(); }</script></body>
                                   </html>`;
                               
                               if (win) { win.document.body.innerHTML = ''; win.document.write(receiptHtml); win.document.close(); }
                               if (orderId) { router.push('/orders'); }
                           }} 
                           disabled={cart.length === 0 || kitchenPrinted}
                           className="col-span-1 py-2 text-xs bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                       >
                           {kitchenPrinted ? "Sent" : "Kitchen"}
                       </button>
                       <button
                           onClick={async () => {
                               const cartSnapshot = [...cart];
                               const subTotal = cartSnapshot.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                               const discountVal = Number(discountAmount) || 0;
                               const finalTotal = Math.max(0, subTotal - discountVal).toFixed(2);
                               const date = new Date().toLocaleString();
                               
                               const win = window.open('', '', 'width=400,height=600');
                               if(win) win.document.write('<html><body><h3>Processing...</h3></body></html>');

                               const savedOrder = await submitOrder(true, true);
                               if (!savedOrder) { win?.close(); return; }
                               
                               const finalOrderId = savedOrder._id || orderId || 'New';

                               const css = `
                                   * { box-sizing: border-box; }
                                   body { font-family: sans-serif, monospace; font-size: 15px; font-weight: bold; margin: 0; padding: 2px; width: 100%; color: #000; }
                                   .text-center { text-align: center; }
                                   .text-right { text-align: right; }
                                   .text-left { text-align: left; }
                                   .bold { font-weight: 900; }
                                   .header { margin-bottom: 5px; }
                                   .store-name { font-size: 21px; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; }
                                   .address { font-size: 13px; margin-bottom: 3px; line-height: 1.1; font-weight: 600; }
                                   .contact { font-size: 13px; font-weight: 900; margin-bottom: 10px; }
                                   .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                                   .order-no { font-size: 18px; font-weight: 900; margin: 5px 0; text-align: center; }
                                   .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                                   .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: 13px; font-weight: 900; }
                                   .items-table td { padding: 3px 0; vertical-align: top; font-size: 13px; font-weight: bold; }
                                   .dotted-line { border-bottom: 1px dashed #000; margin: 3px 0; }
                                   .totals { margin-top: 5px; }
                                   .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 14px; font-weight: bold; }
                                   .grand-total { font-size: 17px; font-weight: 900; margin-top: 3px; }
                                   .footer { margin-top: 15px; text-align: center; font-size: 10px; font-weight: bold; }
                                   .page-break { page-break-before: always; border-top: 1px dashed #000; margin-top: 15px; padding-top: 10px; }
                               `;

                               const getKitchenHtml = () => `
                                   <div class="header text-center">
                                       <div class="store-name">KITCHEN TOKEN</div>
                                   </div>
                                   <div class="meta-row">
                                       <div><span class="bold">Date:</span> ${date}</div>
                                   </div>
                                   <div class="order-no">Order # ${finalOrderId.slice(-4)}</div>
                                   <div class="meta-row bold" style="margin-bottom: 15px;">
                                        <div>Order Type:</div>
                                        <div>${orderType === 'dine-in' ? `Dine In (${tableNo})` : 'TakeAway'}</div>
                                   </div>
                                   <table class="items-table">
                                       <thead>
                                           <tr>
                                               <th style="width: 80%;">Product</th>
                                               <th style="width: 20%; text-align: center;">Qty</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                           ${cartSnapshot.map(item => `
                                               <tr>
                                                   <td class="item-name">${item.name}</td>
                                                   <td style="text-align: center;">${item.quantity}</td>
                                               </tr>
                                               <tr><td colspan="2" style="border-bottom: 1px solid #000;"></td></tr>
                                           `).join('')}
                                       </tbody>
                                   </table>
                               `;

                               const getCustomerHtml = () => `
                                   <div class="header text-center">
                                       <div class="store-name">ACHANAK FOODS</div>
                                       <div class="address">H72M+H72, C Block Block C Gulshan-e-<br>Ravi, Lahore, Punjab 54000</div>
                                       <div class="contact">Contact # 03236060340</div>
                                   </div>
                                   <div class="meta-row">
                                       <div><span class="bold">Invoice #</span> ${finalOrderId.slice(-6).toUpperCase()}</div>
                                       <div class="text-right">
                                           <div style="font-size: 12px; color: #000000;">Punched By</div>
                                           <div class="bold">Mr.Nadeem</div>
                                       </div>
                                   </div>
                                   <div class="meta-row">
                                       <div><span class="bold">Date:</span> ${date}</div>
                                   </div>
                                   <div class="order-no">Order # ${finalOrderId.slice(-4)}</div>
                                   <div class="meta-row bold" style="margin-bottom: 15px;">
                                        <div>Order Type:</div>
                                        <div>${orderType === 'dine-in' ? `Dine In (${tableNo})` : 'TakeAway'}</div>
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
                                           ${cartSnapshot.map(item => `
                                               <tr>
                                                   <td class="item-name">${item.name}</td>
                                                   <td style="text-align: center;">${item.quantity}</td>
                                                   <td style="text-align: right;">${item.price.toFixed(2)}</td>
                                                   <td style="text-align: right;">${(item.price * item.quantity).toFixed(2)}</td>
                                               </tr>
                                               <tr><td colspan="4" style="border-bottom: 1px solid #000;"></td></tr>
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
                                           <div class="total-row" style="font-size: 11px;">
                                                <span>Discount ${discountPercent ? `(${Number(discountPercent).toFixed(0)}%)` : ''}:</span>
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
                               `;

                               const receiptHtml = `
                                   <html>
                                       <head><title>Print Receipt</title><style>${css}</style></head>
                                       <body>
                                           ${getCustomerHtml()}
                                           ${!kitchenPrinted ? `
                                               <div class="page-break"></div>
                                               ${getKitchenHtml()}
                                           ` : ''}
                                           <script>window.onload = function() { window.print(); window.close(); }</script>
                                       </body>
                                   </html>`;

                               if (win) { win.document.body.innerHTML = ''; win.document.write(receiptHtml); win.document.close(); }
                               if (orderId) { router.push('/orders'); }
                           }}
                           disabled={cart.length === 0}
                           className="col-span-2 py-2 text-sm bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex  items-center justify-center gap-0.5 border border-gray-200"
                       >
                           <span className="text-lg">🖨️</span>
                           <span className="text-[10px] uppercase tracking-wide">{orderId ? "Both" : "Both"}</span>
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
