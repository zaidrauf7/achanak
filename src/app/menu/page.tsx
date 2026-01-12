"use client";
import React, { useState, useEffect } from "react";
import { Trash2, Plus, Tag, ChevronDown } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export default function ManageMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Biryani",
    image: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
      }),
    });

    if (res.ok) {
      setFormData({ name: "", price: "", category: "Biryani", image: "" });
      fetchItems(); 
    } else {
      alert("Failed to add item");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
      // Logic for delete will go here
  };

  return (
    <div className="min-h-screen bg-white p-8 max-w-8xl mx-auto">
        <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
            <p className="text-gray-500">Add, edit, or remove items from your menu.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 sticky top-6 shadow-sm">
                    <h2 className="font-bold text-lg mb-6 text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Plus size={18} /></div>
                        Add New Item
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input 
                                required
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-500 text-gray-900"
                                placeholder="e.g. Cheese Burger"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                            <input 
                                required
                                type="number" 
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-500 text-gray-900"
                                placeholder="0.00"
                            />
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                            <input 
                                type="text" 
                                value={formData.image}
                                onChange={(e) => setFormData({...formData, image: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-500 text-gray-900"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer text-gray-700"
                                >
                                    <option value="Biryani">Biryani</option>
                                    <option value="Pulao">Pulao</option>
                                    <option value="Curry">Curry</option>
                                    <option value="Rice">Rice</option>
                                    <option value="Sides">Sides</option>
                                    <option value="Drinks">Drinks</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 shadow-blue-200 shadow-lg mt-2"
                        >
                            {loading ? "Adding..." : "Add Item"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-lg text-gray-800">Current Menu Items</h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {items.map((item) => (
                            <div key={item._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                                        item.category === 'Main' ? 'bg-blue-50 text-blue-600' :
                                        item.category === 'Starter' ? 'bg-orange-50 text-orange-600' :
                                        item.category === 'Drink' ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-600'
                                    }`}>
                                        {item.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{item.category} • ${item.price}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
