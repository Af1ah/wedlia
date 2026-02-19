import { config } from 'dotenv';
config({ path: '.env.local' });
import { hash } from 'bcryptjs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ============================================================
// Admin Seeding Script
// ============================================================

async function seedAdmin() {
  console.log('Starting admin seeding...');

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId) {
      throw new Error('Firebase project ID is required');
    }

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      initializeApp({ projectId });
    }
  }

  const db = getFirestore();

  // Get admin credentials from environment
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin Studio';

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  // Check if admin already exists
  const existingAdmin = await db
    .collection('users')
    .where('email', '==', adminEmail.toLowerCase())
    .limit(1)
    .get();

  if (!existingAdmin.empty) {
    console.log(`Admin user already exists: ${adminEmail}`);
    process.exit(0);
  }

  // Hash password
  const passwordHash = await hash(adminPassword, 12);

  // Create admin user
  const userData = {
    displayName: adminName,
    email: adminEmail.toLowerCase(),
    passwordHash,
    role: 'admin',
    isActive: true,
    isLocked: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('users').add(userData);
  
  console.log(`Admin user created successfully!`);
  console.log(`  ID: ${docRef.id}`);
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Name: ${adminName}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
