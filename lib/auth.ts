import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get the current session
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get the current user with role
export async function getCurrentUser() {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true      
      }
    });
    
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Check if user has admin role
export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  if (user.role !== "admin") {
    redirect("/unauthorized");
  }
  
  return user;
}