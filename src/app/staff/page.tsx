"use client";
import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import Loader from "@/components/ui/Loader";

interface UserType {
    _id: string;
    name: string;
    username: string;
    role: string;
    lastLogin?: string;
    lastLogout?: string;
}

export default function StaffPage() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [deleteModal, setDeleteModal] = useState<{show: boolean, user: UserType | null}>({ show: false, user: null });
    const [confirmUsername, setConfirmUsername] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        // ... same as before
        fetch("/api/users")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Failed to fetch");
            })
            .then(data => {
                setUsers(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // ... same logic
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, role: "manager" })
            });
            
            const data = await res.json();

            if (res.ok) {
                setFormData({ name: "", username: "", password: "" });
                fetchUsers();
                alert("Manager added successfully!");
            } else {
                setError(data.error || "Failed to add manager");
            }
        } catch (err) {
            setError("Something went wrong");
        }
        setSubmitting(false);
    };

    const handleDeleteClick = (user: UserType) => {
        setDeleteModal({ show: true, user });
        setConfirmUsername("");
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.user) return;
        if (confirmUsername !== deleteModal.user.username) {
            alert("Username does not match.");
            return;
        }

        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/users?id=${deleteModal.user._id}`, { method: "DELETE" });
            if (res.ok) {
                fetchUsers();
                setDeleteModal({ show: false, user: null });
            } else {
                alert("Failed to delete user");
            }
        } catch (e) {
            alert("Error deleting user");
        }
        setDeleteLoading(false);
    };

    if (loading) {
        return <Loader fullScreen={false} className="h-screen" text="Loading staff..." />;
    }

    return (
        <div className="min-h-screen bg-white p-8 max-w-7xl mx-auto relative">
             <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
                <p className="text-gray-500">Create and manage accounts for your managers.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 sticky top-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-gray-800">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><UserPlus size={20} /></div>
                             <h2 className="font-bold text-lg">Add New Manager</h2>
                        </div>
                        
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    placeholder="manager_john"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input 
                                    required
                                    type="password" 
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 shadow-blue-200 shadow-lg mt-2"
                            >
                                {submitting ? "Creating..." : "Create Account"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-bold text-lg text-gray-800">Current Managers</h2>
                        </div>
                        
                        {users.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                No managers found. Create one to get started.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <div key={user._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg border border-gray-200">
                                                {user.name?.[0]?.toUpperCase() || <User size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{user.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                                    <span>@{user.username}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                                                        <Shield size={10} /> Manager
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-col gap-1 text-xs text-gray-400">
                                                    {user.lastLogin && (
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-2 h-2 rounded-full ${(!user.lastLogout || new Date(user.lastLogin) > new Date(user.lastLogout)) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                            <span>
                                                                {(!user.lastLogout || new Date(user.lastLogin) > new Date(user.lastLogout)) 
                                                                    ? "Currently Active" 
                                                                    : `Last seen: ${new Date(user.lastLogout).toLocaleString()}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.lastLogin && (
                                                        <div className="opacity-75">
                                                            Login: {new Date(user.lastLogin).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteClick(user)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal.show && deleteModal.user && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Manager?</h2>
                            <p className="text-gray-500 text-sm">
                                This action cannot be undone. Please type <span className="font-bold text-gray-900">{deleteModal.user.username}</span> to confirm deletion.
                            </p>
                        </div>
                        
                        <input 
                            type="text" 
                            value={confirmUsername}
                            onChange={(e) => setConfirmUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none mb-4 text-center font-bold"
                            placeholder="Type username here"
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteModal({ show: false, user: null })}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteConfirm}
                                disabled={confirmUsername !== deleteModal.user.username || deleteLoading}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
