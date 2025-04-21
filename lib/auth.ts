// lib/auth.ts
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { AuthOptions } from "next-auth"; // Import base type
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        password: true,
                        role: true,
                    }
                });

                if (!user || !user.password) {
                    console.error("User not found or password not set for email:", credentials.email);
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    console.warn("Invalid password attempt for email:", credentials.email);
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token?.id && token?.role) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            } else {
                 console.warn("Session callback - Missing data in token or session:", { sessionExists: !!session?.user, tokenId: token?.id, tokenRole: token?.role });
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === 'development',
};

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