//app/layout.tsx

import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import UserMenu from "@/app/components/Auth/UserMenu";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Label Express",
  description: "the labeling app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <AuthProvider>
          <div className="h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
              <div className="w-full px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <h1 className="text-xl font-bold text-gray-800">
                    <Link href="/">Label Express</Link>
                  </h1>
                </div>
                <UserMenu />
              </div>
            </header>
            <main className="flex-1 overflow-auto h-full">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
