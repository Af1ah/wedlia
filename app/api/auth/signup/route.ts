import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';

// ============================================================
// Signup API Endpoint
// ============================================================

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: 'studio' | 'client';
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { name, email, password, role = 'studio' } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check for existing user
    const db = getAdminDb();
    const existingUser = await db
      .collection(COLLECTIONS.USERS)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user document
    const userData = {
      displayName: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      isActive: true,
      isLocked: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTIONS.USERS).add(userData);

    console.log(`[Signup] User created: ${docRef.id} (${email})`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account created successfully',
        userId: docRef.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
