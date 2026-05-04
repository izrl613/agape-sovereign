import * as functions from "firebase-functions/v1";
import * as v2 from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

// Basic health check function
export const healthCheck = v2.https.onRequest((request, response) => {
  functions.logger.info("Health check triggered", {structuredData: true});
  response.send("Agape Sovereign Architect AI - Functions are LIVE.");
});

// Example trigger for user creation
export const onUserCreated = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  const {uid, email, displayName} = user;
  
  try {
    await admin.firestore().collection("users").doc(uid).set({
      uid,
      email: email || "unknown@example.com",
      displayName: displayName || "",
      role: "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sovereignScore: 100,
      setupComplete: false
    }, {merge: true});
    
    functions.logger.info(`User profile initialized for ${uid}`);
  } catch (error) {
    functions.logger.error("Error initializing user profile:", error);
  }
});
