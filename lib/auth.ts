import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { COLLECTIONS } from '@/constants';
import { User as AppUser, UserRole } from '@/types';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// ============================================================
// Firebase Admin Initialization for Auth
// ============================================================

let adminDb: Firestore | null = null;
let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId) {
    throw new Error('Firebase project ID is required');
  }

  if (getApps().length === 0) {
    if (clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      adminApp = initializeApp({ projectId });
    }
  } else {
      adminApp = getApps()[0];
  }

  return adminApp;
}

function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  getAdminApp();
  adminDb = getFirestore();
  return adminDb;
}

// ============================================================
// Auth Helper Functions
// ============================================================

async function findUserByEmail(email: string): Promise<AppUser | null> {
  try {
    console.log(`[Auth] Finding user ${email}...`);
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
        console.log(`[Auth] No user found for ${email}`);
        return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    console.log('[Auth] User found:', doc.id, data.role);
    return { id: doc.id, ...data } as unknown as AppUser;
  } catch (error) {
    console.error('[Auth] Error finding user:', error);
    if (error instanceof Error) console.error(error.stack);
    return null;
  }
}

/**
 * Find or create a client user from Google OAuth
 * Only allows client role for Google auth
 */
async function findOrCreateGoogleUser(
  email: string,
  name: string,
  image?: string
): Promise<{ user: AppUser | null; error?: string }> {
  try {
    const db = getAdminDb();
    const existingUser = await findUserByEmail(email);

    // If user exists, check if they're a client
    if (existingUser) {
      if (existingUser.role !== 'client') {
        console.log(`[Auth] Google login rejected: ${email} is a ${existingUser.role}`);
        return { 
          user: null, 
          error: 'This email is registered as a studio account. Please use studio login.' 
        };
      }
      
      // Update last login
      await db.collection(COLLECTIONS.USERS).doc(existingUser.id).update({
        lastLoginAt: FieldValue.serverTimestamp(),
      });
      
      return { user: existingUser };
    }

    // Create new client user
    console.log(`[Auth] Creating new client user: ${email}`);
    const newUserRef = db.collection(COLLECTIONS.USERS).doc();
    const now = FieldValue.serverTimestamp();
    
    const newUserData = {
      email,
      displayName: name || email.split('@')[0],
      role: 'client' as UserRole,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      authProvider: 'google',
      profileImage: image || null,
    };

    await newUserRef.set(newUserData);

    return {
      user: {
        id: newUserRef.id,
        email: newUserData.email,
        displayName: newUserData.displayName,
        role: newUserData.role,
        isActive: newUserData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AppUser,
    };
  } catch (error) {
    console.error('[Auth] Error in findOrCreateGoogleUser:', error);
    return { user: null, error: 'Failed to create account' };
  }
}

// ============================================================
// NextAuth Configuration
// ============================================================

export const authOptions: NextAuthOptions = {
  // ============================================================
  // Session Strategy - JWT for stateless authentication
  // ============================================================
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,  // Update token every 24 hours
  },

  // ============================================================
  // JWT Configuration
  // ============================================================
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // ============================================================
  // Cookie Configuration - Secure settings
  // ============================================================
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // ============================================================
  // Authentication Providers
  // ============================================================
  providers: [
    // Studio/Admin Credentials Provider
    CredentialsProvider({
      id: 'studio-login',
      name: 'Studio Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        console.log('Attempting Studio/Admin Login:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await findUserByEmail(credentials.email);
        
        if (!user) {
             console.log('Login Failed: User not found');
             throw new Error('Invalid credentials');
        }
        
        // Accept both studio and admin roles
        if (!user.passwordHash || (user.role !== 'studio' && user.role !== 'admin')) {
          console.log('Login Failed: Role/Hash mismatch', { role: user.role, hasHash: !!user.passwordHash });
          throw new Error('Invalid credentials');
        }

        const isValidPassword = await compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          console.log('Login Failed: Password mismatch');
          throw new Error('Invalid credentials');
        }

        if (user.isLocked) {
             console.log('Login Failed: Account locked');
             throw new Error('Account is locked');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role, // Return actual role from database
        };
      },
    }),

    // Client Credentials Provider
    CredentialsProvider({
      id: 'client-login',
      name: 'Client Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await findUserByEmail(credentials.email);
        
        if (!user || !user.passwordHash || user.role !== 'client') {
          throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated');
        }

        const isValidPassword = await compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: 'client',
        };
      },
    }),

    // Google OAuth Provider (for clients only)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly',
          ].join(' '),
        },
      },
    }),
  ],

  // ============================================================
  // Callbacks - Token refresh and session management
  // ============================================================
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - set user data
      if (user) {
        console.log('[Auth] JWT Callback: Initial Sign In', user.id);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = generateAccessToken();
      }

      // Store Google OAuth tokens for Drive API access
      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
      }

      // Token refresh - update session if triggered
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
      }

      // Regenerate Firebase custom token (they expire after 1 hour)
      if (token.id && token.role) {
        try {
          getAdminApp();
          const additionalClaims = { role: token.role };
          const customToken = await getAuth().createCustomToken(token.id, additionalClaims);
          token.firebaseToken = customToken;
        } catch (error) {
          console.error('[Auth] Error minting custom token:', error);
          token.firebaseToken = undefined;
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
        };
        session.accessToken = token.accessToken;
        session.firebaseToken = token.firebaseToken;
        session.googleAccessToken = token.googleAccessToken;
      }

      return session;
    },

    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        // First, check if user already exists in our database
        const existingUser = await findUserByEmail(user.email);
        
        if (existingUser) {
          // User exists - use their actual role
          user.id = existingUser.id;
          user.role = existingUser.role;
          user.name = existingUser.displayName;
          
          // Update last login
          try {
            const db = getAdminDb();
            await db.collection(COLLECTIONS.USERS).doc(existingUser.id).update({
              lastLoginAt: FieldValue.serverTimestamp(),
            });
          } catch (error) {
            console.error('[Auth] Error updating last login:', error);
          }
          
          return true;
        }
        
        // New user - create as client
        const result = await findOrCreateGoogleUser(
          user.email,
          user.name || '',
          user.image || undefined
        );

        if (result.error || !result.user) {
          return `/client-login?error=${encodeURIComponent(result.error || 'Failed to sign in')}`;
        }

        user.id = result.user.id;
        user.role = 'client';
        user.name = result.user.displayName;
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // If url is a relative path, prepend baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If url is from same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  // ============================================================
  // Custom Pages
  // ============================================================
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // ============================================================
  // Events - For logging
  // ============================================================
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },

  // ============================================================
  // Debug Mode
  // ============================================================
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================
// Helper Functions
// ============================================================

function generateAccessToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default authOptions;
