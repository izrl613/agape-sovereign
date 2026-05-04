"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.healthCheck = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
// Basic health check function
exports.healthCheck = functions.https.onRequest((request, response) => {
    functions.logger.info("Health check triggered", { structuredData: true });
    response.send("Agape Sovereign Architect AI - Functions are LIVE.");
});
// Example trigger for user creation
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;
    try {
        await admin.firestore().collection("users").doc(uid).set({
            uid,
            email: email || "unknown@example.com",
            displayName: displayName || "",
            role: "user",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            sovereignScore: 100,
            setupComplete: false
        }, { merge: true });
        functions.logger.info(`User profile initialized for ${uid}`);
    }
    catch (error) {
        functions.logger.error("Error initializing user profile:", error);
    }
});
//# sourceMappingURL=index.js.map