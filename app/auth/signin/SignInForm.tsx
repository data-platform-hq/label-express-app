// app/auth/signin/SignInForm.tsx
'use client'

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation" // <-- Moved hook here
import Link from "next/link"

export default function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams() // <-- Moved hook here
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check URL params on mount/change
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! Please sign in.")
    }
    const errorParam = searchParams.get("error");
    if (errorParam) {
       setError("Invalid email or password"); // Or more specific based on errorParam
    }
    // Clear success message if params change and don't indicate success
    else if (searchParams.get("registered") !== "true") {
        setSuccess("");
    }

  }, [searchParams]) // Dependency array

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("") // Clear previous errors

    try {
      const result = await signIn("credentials", {
        // redirect: false, // Let NextAuth handle redirect
        email,
        password,
        callbackUrl: callbackUrl
      })

      if (result?.error && !result.ok) { // Check if signIn itself reported an error without redirecting
        console.error("Sign in failed:", result.error);
        // Error already handled by useEffect reading URL param usually
        // setError("An unexpected error occurred during sign in.");
        setIsLoading(false);
      }
     // If successful, NextAuth should redirect via callbackUrl
     // If not, it redirects back here with ?error=...

    } catch (error) {
      console.error("Sign in exception:", error);
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
    // Don't set isLoading false here if waiting for NextAuth redirect
  }

  // JSX for the form and surrounding elements
  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email" name="email" type="email" required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password" name="password" type="password" required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button type="submit" disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/forgot-password" /* Implement this page */ className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm">
            <Link href="/auth/signup" /* Implement this page */ className="font-medium text-blue-600 hover:text-blue-500">
              Create an account
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}