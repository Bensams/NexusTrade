import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "./db";
import { logActivity } from "./auditLog";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    trustHost: true, // Trust host for Docker/localhost environments
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                // Check if user is banned
                if (user.bannedUntil && user.bannedUntil > new Date()) {
                    const isPermanent = user.bannedUntil.getFullYear() >= 9999;
                    console.warn(
                        `Banned user attempted login: ${user.email} (${isPermanent ? "permanent" : `until ${user.bannedUntil.toISOString()}`})`
                    );
                    return null; // Deny login for banned users
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    events: {
        // Log successful logins (note: request headers not available in events)
        async signIn({ user }) {
            if (user?.id) {
                logActivity({
                    userId: user.id,
                    actionType: "USER_LOGIN",
                    metadata: {
                        email: user.email,
                        provider: "credentials_or_oauth",
                    },
                });
            }
        },
    },
    callbacks: {
        async jwt({ token, user, trigger, session: updateSession }) {
            if (user) {
                token.id = user.id;
                token.image = user.image;
                token.name = user.name;
            }

            // When session is updated (e.g., after profile update), refresh from database
            if (trigger === "update" && updateSession) {
                // If name was updated, use it
                if (updateSession.name) {
                    token.name = updateSession.name;
                }
                // Fetch fresh user data from database to get updated image
                if (token.id) {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { image: true, name: true },
                    });
                    if (freshUser) {
                        token.image = freshUser.image;
                        token.name = freshUser.name;
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.image = token.image as string | null;
                session.user.name = token.name as string | null;
            }
            return session;
        },
    },
});
