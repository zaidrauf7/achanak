"use client";
import React, { useState, useEffect } from "react";
import { Trash2, Plus, Tag, ChevronDown, Pencil, X } from 'lucide-react';
import Loader from "@/components/ui/Loader";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image?: string;
}

export default function ManageMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Chicken Biryani",
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
          setItems(Array.isArray(data) ? data : []);
          setInitialLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const commonHeaders = { "Content-Type": "application/json" };
    const body = JSON.stringify({
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
    });

    let res;
    if (editingId) {
        res = await fetch(`/api/menu/${editingId}`, {
            method: "PUT",
            headers: commonHeaders,
            body: body
        });
    } else {
        res = await fetch("/api/menu", {
            method: "POST",
            headers: commonHeaders,
            body: body
        });
    }

    if (res.ok) {
      setFormData({ name: "", price: "", category: "Chicken Biryani", image: "" });
      setEditingId(null);
      fetchItems(); 
    } else {
      alert(editingId ? "Failed to update item" : "Failed to add item");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this item?")) return;
      
      const res = await fetch(`/api/menu/${id}`, {
          method: "DELETE"
      });

      if (res.ok) {
          fetchItems();
      } else {
          alert("Failed to delete item");
      }
  };

  const handleEdit = (item: MenuItem) => {
      setEditingId(item._id);
      setFormData({
          name: item.name,
          price: item.price.toString(),
          category: item.category,
          image: item.image || ""
      });
      // Scroll to top to see form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setFormData({ name: "", price: "", category: "Chicken Biryani", image: "" });
  };

  if (initialLoading) {
      return <Loader fullScreen={false} className="h-screen" text="Loading menu items..." />;
  }

  return (
    <div className="min-h-screen bg-white p-8 max-w-8xl mx-auto">
        <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
            <p className="text-gray-500">Add, edit, or remove items from your menu.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 sticky top-6 shadow-sm">
                    <h2 className="font-bold text-lg mb-6 text-gray-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${editingId ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                            </div>
                            {editingId ? "Update Item" : "Add New Item"}
                        </div>
                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                <X size={14} /> Cancel
                            </button>
                        )}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs)</label>
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
                                    <option value="Chicken Biryani">Chicken Biryani</option>
                                    <option value="Daal Chawal">Daal Chawal</option>
                                    <option value="Daal">Daal</option>
                                    <option value="Chicken Pulao">Chicken Pulao</option>
                                    <option value="Palak Chawal">Palak Chawal</option>
                                    <option value="BEEF Pulao">BEEF Pulao</option>
                                    <option value="Zarda">Zarda</option>
                                    <option value="Raita + Salad">Raita + Salad</option>
                                    <option value="Drinks">Drinks</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-3 text-white rounded-xl font-bold hover:shadow-lg transition active:scale-95 disabled:opacity-50 shadow-md mt-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                        >
                            {loading ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Item" : "Add Item")}
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
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden ${
                                        item.category.includes('Biryani') ? 'bg-orange-50 text-orange-600' :
                                        item.category.includes('Pulao') ? 'bg-yellow-50 text-yellow-600' :
                                        item.category.includes('Palak') ? 'bg-green-50 text-green-600' :
                                        item.category.includes('Daal') ? 'bg-amber-50 text-amber-600' : 
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{item.category} • Rs {item.price}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
