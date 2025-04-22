// app/auth/signin/page.tsx
import { Suspense } from 'react';
import SignInForm from './SignInForm'; // Import the new component

// Define a simple loading fallback UI
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div>Loading...</div> {/* Or a spinner component */}
    </div>
  );
}

// This page component itself no longer uses 'use client' or dynamic hooks
export default function SignInPage() {
  return (
    // Wrap the component that uses useSearchParams in Suspense
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
       <Suspense fallback={<LoadingFallback />}>
          <SignInForm />
       </Suspense>
    </div>
  );
}