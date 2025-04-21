// app/admin/layout.tsx

import { requireAdmin } from "@/lib/auth";

// Add this line: Opt-out of static generation for this layout
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not admin
  await requireAdmin();
  
  return (
    <div className="bg-gray-100 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}