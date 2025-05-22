import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { googleProvider } from '@/providers';
import type { Provider } from 'next-auth/providers/index';

export const authOptions: NextAuthOptions = {
  providers: [
    // Include Google provider only if it's configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [googleProvider as Provider]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // Update lastLogin timestamp
        try {
          // Update the lastLogin timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        } catch (error) {
          console.error('Error updating lastLogin:', error);
          // Continue with authentication even if lastLogin update fails
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Make sure we have a valid user object with email
      if (!user?.email) {
        console.error('Invalid user object during sign in:', user);
        return false;
      }

      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email as string },
          });

          if (!existingUser) {
            // Create new user if they don't exist
            await prisma.user.create({
              data: {
                email: user.email as string,
                name: user.name || user.email.split('@')[0], // Fallback name if none provided
                image: user.image,
                role: 'user', // Default role
                lastLogin: new Date(),
              },
            });
          } else {
            // Update existing user's last login
            await prisma.user.update({
              where: { email: user.email as string },
              data: { lastLogin: new Date() },
            });
          }
        } catch (error) {
          console.error('Error during social login:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      try {
        // Only update user data and lastLogin when the user first logs in
        if (user && account) {
          // Make sure we have a valid user ID
          if (!user.id) {
            console.error('Invalid user ID in JWT callback:', user);
            return token;
          }

          token.id = user.id;
          token.role = user.role || 'user'; // Default to user role for social logins

          // Update lastLogin for credential logins
          if (account.provider === 'credentials') {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
              });
            } catch (error) {
              console.error('Error updating lastLogin in JWT callback:', error);
              // Continue with token creation even if lastLogin update fails
            }
          }
        }
        return token;
      } catch (error) {
        console.error('Error in JWT callback:', error);
        // Return the original token if there's an error
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          // Make sure token has the required properties
          if (typeof token.id !== 'string') {
            console.error('Invalid token ID in session callback:', token);
            return session;
          }

          session.user.id = token.id;
          session.user.role = (token.role as string) || 'user';
        }
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        // Return the original session if there's an error
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
