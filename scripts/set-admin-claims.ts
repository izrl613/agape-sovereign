/**
 * Admin Claims Setup Script
 * 
 * This script sets custom admin claims for specific users.
 * Run this script after setting up your Firebase project to configure admin access.
 * 
 * Usage:
 * 1. Set your admin email(s) in the ADMIN_EMAILS array
 * 2. Run: npx ts-node scripts/set-admin-claims.ts
 * 
 * Environment variables required:
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service account key
 * - FIREBASE_PROJECT_ID: Your Firebase project ID
 */

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configuration
const ADMIN_EMAILS = [
  'idin@agape.nyc',
  'agape@sovereign.nyc'
];

// Initialize Firebase Admin
if (!getApps().length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
  } else {
    // Use default application credentials
    initializeApp();
  }
}

const auth = getAuth();
const db = getFirestore();

async function setAdminClaims() {
  console.log('🔧 Setting admin claims for configured users...');
  
  for (const email of ADMIN_EMAILS) {
    try {
      // Get user by email
      const userRecord = await auth.getUserByEmail(email);
      
      if (!userRecord) {
        console.log(`⚠️  User not found: ${email}`);
        continue;
      }
      
      // Set custom admin claim
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
      
      // Update user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        role: 'admin',
        email: email,
        adminClaimsSet: new Date().toISOString()
      }, { merge: true });
      
      console.log(`✅ Admin claim set for: ${email} (UID: ${userRecord.uid})`);
      
    } catch (error) {
      console.error(`❌ Error setting admin claim for ${email}:`, error);
    }
  }
  
  console.log('\n🎉 Admin claims setup complete!');
  console.log('Note: Users may need to sign out and sign back in for claims to take effect.');
}

// Run the setup
setAdminClaims().catch(console.error);