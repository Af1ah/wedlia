// ============================================================
// Application Types
// ============================================================

/**
 * User roles in the system
 * - studio: Wedding studio owners who manage their portfolio
 * - client: Couples browsing wedding content
 */
export type UserRole = 'studio' | 'client' | 'admin';

/**
 * Base user type stored in Firestore
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordHash?: string;
  isActive: boolean;
  isLocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * Authenticated user data (safe to expose to client)
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ============================================================
// NextAuth Type Extensions
// ============================================================

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
    accessToken?: string;
    firebaseToken?: string;
    googleAccessToken?: string; // For Google Drive API
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    accessToken?: string;
    firebaseToken?: string;
    googleAccessToken?: string; // For Google Drive API
    googleRefreshToken?: string;
  }
}
