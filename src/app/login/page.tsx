"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
        const data = await res.json();
        
        // If owner, let them choose. If manager, go straight to POS.
        if (data.role === "owner") {
            setShowRoleSelection(true);
        } else {
            router.push("/create-order");
        }
    } else {
        setError("Invalid credentials");
    }
  };

  const traverseTo = (path: string) => {
      router.push(path);
  };

  if (showRoleSelection) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-xl text-white">
                        <ChefHat size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-gray-500 mb-8">Where would you like to go?</p>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => traverseTo('/dashboard')}
                        className="w-full py-4 border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-colors flex flex-col items-center"
                    >
                        <span className="text-lg">Owner Dashboard</span>
                        <span className="text-xs font-normal opacity-75">View Sales & Analytics</span>
                    </button>

                    <button 
                        onClick={() => traverseTo('/create-order')}
                        className="w-full py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:border-gray-900 hover:text-gray-900 transition-all flex flex-col items-center"
                    >
                         <span className="text-lg">Manager POS</span>
                         <span className="text-xs font-normal opacity-75">Create & Manage Orders</span>
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl text-white">
                <ChefHat size={32} />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Sign In</h2>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500 text-gray-900"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">Default: manager / 123</p>
      </div>
    </div>
  );
}
