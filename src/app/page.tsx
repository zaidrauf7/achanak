"use client";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
          if (res.ok) return res.json();
          return null;
      })
      .then(user => {
          if (user) {
              if (user.role === 'manager') router.push('/create-order');
              else if (user.role === 'owner') router.push('/login'); // Let owner choose at login screen (which now has selection)
              else router.push('/dashboard');
          } else {
              setChecking(false);
          }
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="animate-pulse flex flex-col items-center">
                  <div className="bg-blue-600 p-4 rounded-2xl mb-4">
                     <ChefHat size={32} className="text-white" />
                  </div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-50/50 -skew-y-3 transform origin-top-left -z-10" />
      
      <div className="text-center mb-16 z-10">
        <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-2xl mb-6 shadow-xl shadow-blue-200">
             <ChefHat size={48} className="text-white" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Resto<span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-md mx-auto leading-relaxed">
          The modern operating system for your restaurant business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4 z-10">
        {/* Manager Option */}
        <Link href="/login" className="group relative">
           <div className="absolute inset-0 bg-blue-600 rounded-3xl transform translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
           <div className="relative bg-white border-2 border-gray-100 p-10 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer h-full flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-4xl">
                    🧑‍🍳
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Manager Station</h2>
                <p className="text-gray-500 mb-8">Login to create orders, manage tables, and handle customer billing.</p>
                <span className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold group-hover:bg-blue-600 transition-colors w-full">
                    Enter as Manager
                </span>
           </div>
        </Link>

        {/* Owner Option */}
        <Link href="/login" className="group relative">
           <div className="absolute inset-0 bg-gray-800 rounded-3xl transform translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
           <div className="relative bg-white border-2 border-gray-100 p-10 rounded-3xl shadow-sm hover:border-gray-800 transition-all cursor-pointer h-full flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-4xl">
                    📊
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Owner Dashboard</h2>
                <p className="text-gray-500 mb-8">Access real-time sales analytics, revenue charts, and menu control.</p>
                <span className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-semibold group-hover:border-gray-800 transition-colors w-full">
                    Enter as Owner
                </span>
           </div>
        </Link>
      </div>

      <div className="mt-16 text-sm text-gray-400 font-medium">
        Powered by Next.js 15 & MongoDB
      </div>
    </div>
  );
}
