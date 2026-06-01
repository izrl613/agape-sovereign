<firebase_prompts hash="f9c861cf">
<!-- Firebase Tools Context - Auto-generated, do not edit -->
# Firebase CLI Context

<project-structure>
```
project/
├── firebase.json          # Main configuration
├── .firebaserc           # Project aliases
├── firestore.rules       # Security rules
├── functions/            # Cloud Functions
├── public/               # Hosting files
└── firebase-debug.log    # Created when CLI commands fail
```
</project-structure>

## Common Commands

<example>
```bash
# Initialize new features
firebase init hosting
firebase init functions
firebase init firestore

# Deploy everything or specific services

firebase deploy
firebase deploy --only hosting
firebase deploy --only functions:processOrder,functions:sendEmail
firebase deploy --except functions

# Switch between projects

firebase use staging
firebase use production
```
</example>

## Local Development

<example>
```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only functions,firestore

# Common emulator URLs
# Emulator UI: http://localhost:4000
# Functions: http://localhost:5001
# Firestore: http://localhost:8080
# Hosting: http://localhost:5000
````

</example>

## Debugging Failed Commands

<example>
```bash
# When any firebase command fails
cat firebase-debug.log    # Contains detailed error traces

# Common fixes for errors in debug log

firebase login --reauth # Fix authentication errors
firebase use # Fix wrong project errors

````
</example>

## Complete Workflow Example

<example>
```bash
# Clone and setup a Firebase project
git clone https://github.com/example/my-app
cd my-app

# Initialize Firebase in existing project
firebase init

# Start local development
firebase emulators:start

# Make changes, then deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy --only hosting,firestore
````

</example>

## Service Detection in firebase.json

<example>
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 }
  }
}
```
</example>


# Firebase Functions Context (SDK 6.0.0+)

Always use v2 functions for new development. Use v1 only for Analytics, basic Auth, and Test Lab triggers.

For SDK versions before 6.0.0, add `/v2` to import paths (e.g., `firebase-functions/v2/https`).

## Function Imports (SDK 6.0.0+)

<example>
```typescript
// HTTPS functions
import {onRequest, onCall} from 'firebase-functions/https';

// Firestore triggers
import {onDocumentCreated, onDocumentUpdated, onDocumentDeleted} from 'firebase-functions/firestore';

// RTDB triggers
import {onValueCreated, onValueWritten, onValueUpdated, onValueDeleted} from 'firebase-functions/database';

// Scheduled functions
import {onSchedule} from 'firebase-functions/scheduler';

// Storage triggers
import {onObjectFinalized, onObjectDeleted} from 'firebase-functions/storage';

// Pub/Sub triggers
import {onMessagePublished} from 'firebase-functions/pubsub';

// Blocking Auth triggers
import {beforeUserCreated, beforeUserSignedIn} from 'firebase-functions/identity';

// Test Lab triggers
import {onTestMatrixCompleted} from 'firebase-functions/testLab';

// Deferred initialization
import {onInit} from 'firebase-functions';

// Structured logging
import {logger} from 'firebase-functions';

// Configuration
import {defineString, defineInt, defineSecret} from 'firebase-functions/params';
import * as params from 'firebase-functions/params';

// Note: For SDK versions before 6.0.0, add /v2 to import paths:
// import {onRequest} from 'firebase-functions/v2/https';

````
</example>

## v1 Functions (Analytics & Basic Auth Only)

<example>
```typescript
// Use v1 ONLY for these triggers
import * as functionsV1 from 'firebase-functions/v1';
import {logger} from 'firebase-functions';

// Analytics triggers (v1 only)
export const onPurchase = functionsV1.analytics.event('purchase').onLog((event) => {
  logger.info('Purchase event', {
    value: event.params?.value,
    currency: event.params?.currency
  });
});

// Basic Auth triggers (v1 only)
export const onUserCreate = functionsV1.auth.user().onCreate((user) => {
  logger.info('User created', { uid: user.uid, email: user.email });
  // Initialize user profile...
});

export const onUserDelete = functionsV1.auth.user().onDelete((user) => {
  logger.info('User deleted', { uid: user.uid });
  // Cleanup user data...
});
````

</example>

## Environment Configuration

<example>
```typescript
import {defineString, defineInt, defineSecret} from 'firebase-functions/params';
import * as params from 'firebase-functions/params';
import {onRequest} from 'firebase-functions/https';
import {logger} from 'firebase-functions';

// Built-in params available automatically
const projectId = params.projectID;
const databaseUrl = params.databaseURL;
const bucket = params.storageBucket;
const gcpProject = params.gcloudProject;

// Custom params
const apiUrl = defineString('API_URL', {
  default: 'https://api.example.com'
});

const environment = defineString('ENVIRONMENT', {
  default: 'dev'
});

const apiKey = defineSecret('STRIPE_KEY');

// Using params directly in runtime configuration
export const processPayment = onRequest({
  secrets: [apiKey],
  memory: defineString('PAYMENT_MEMORY', { default: '1GiB' }),
  minInstances: environment.equals('production').thenElse(5, 0),
  maxInstances: environment.equals('production').thenElse(1000, 10)
}, async (req, res) => {
  logger.info('Processing payment', {
    project: projectId.value(),
    bucket: bucket.value(),
    env: environment.value()
  });

  const key = apiKey.value();
  const url = apiUrl.value();
  // Process payment...
});

````
</example>

## Deferred Initialization

<example>
```typescript
import {onInit} from 'firebase-functions';
import {onRequest} from 'firebase-functions/https';

let heavyClient: HeavySDK;

onInit(async () => {
  const {HeavySDK} = await import('./lib/heavy-sdk');
  heavyClient = new HeavySDK({
    // Expensive initialization...
  });
});

export const useHeavyClient = onRequest(async (req, res) => {
  const result = await heavyClient.process(req.body);
  res.json(result);
});
````

</example>

## Structured Logging

<example>
```typescript
import {logger} from 'firebase-functions';
import {onRequest} from 'firebase-functions/https';

interface OrderRequest {
  orderId: string;
  userId: string;
  amount: number;
}

export const processOrder = onRequest(async (req, res) => {
  const {orderId, userId, amount} = req.body as OrderRequest;

  logger.info("Processing order", {
    orderId,
    userId,
    amount
  });

  try {
    // Process...
    logger.log("Order complete", { orderId });
    res.json({ success: true });
  } catch (error) {
    logger.error("Order failed", {
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: "Processing failed" });
  }
});

````
</example>

## Development Commands

<example>
```bash
# TypeScript development
cd functions
npm install
npm run build        # Compile TypeScript

# Local development

firebase emulators:start --only functions

# Testing functions

npm test # Run unit tests
npm run serve # TypeScript watch + emulators

# Deployment

firebase deploy --only functions
firebase deploy --only functions:api,functions:onUserCreate

# Debugging

firebase functions:log
firebase functions:log --only api --lines=50

````

</example>

</firebase_prompts>