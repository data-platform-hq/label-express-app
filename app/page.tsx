// app/page.tsx
import { getIndices } from '@/lib/opensearch';
import FieldSelector from '@/app/components/FieldsSelector/FieldSelector';
import { FormStateProvider } from '@/app/contexts/FormStateContext';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Page() {

  // Check for authentication
  const session = await getServerSession(authOptions);
  // Fetch available indices on the server side
  const indices = await getIndices();
  
  return (
    <div className="w-full h-full p-2">
      <FormStateProvider>
      <FieldSelector indices={indices} />
      </FormStateProvider>
    </div>
  );
}