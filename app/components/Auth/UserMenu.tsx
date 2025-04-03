// app/components/Auth/UserMenu.tsx
'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
   
  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
  }
  
  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Sign in
      </button>
    )
  }
  
  // Check if user is admin
  const isAdmin = session.user?.role === "admin";
  
  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {session.user?.name?.charAt(0) || "U"}
        </div>
        <span className="text-sm font-medium text-gray-700">{session.user?.name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                Admin
              </span>
            )}
          </div>
          
          {isAdmin && (
            <Link
              href="/admin/users"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              User Management
            </Link>
          )}

          
          <button
            onClick={() => {
              setIsMenuOpen(false)
              signOut()
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}