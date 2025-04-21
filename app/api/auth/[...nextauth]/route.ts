// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth"; // Adjust path if you used a different file name


// This part is correct: Initialize NextAuth with the options
const handler = NextAuth(authOptions) // Renamed 'handlers' to 'handler' for clarity, but 'handlers' is fine too.

// This part is correct: Export the handler for GET and POST requests
export { handler as GET, handler as POST }