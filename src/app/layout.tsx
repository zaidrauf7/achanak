import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import Shell from "@/components/Shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurant OS",
  description: "Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <Shell>
             {children}
        </Shell>
      </body>
    </html>
  );
}
