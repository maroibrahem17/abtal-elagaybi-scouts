# Firebase Phase 1 Setup

This repository is prepared for a new, dedicated Firebase project for Abtal 3gaiby Scouts. It is not connected to the old Road Helper project.

## Local configuration

1. Create a new Firebase project in Firebase Console.
2. Register a Web App in that project.
3. Copy `.env.example` to `.env.local`.
4. Fill the six `VITE_FIREBASE_*` values from the new Web App configuration.
5. Enable Authentication > Sign-in method > Email/Password.
6. Create the first admin user manually in Authentication.
7. Create `users/{uid}` in Firestore with:

```text
email: the admin email
role: admin
createdAt: server timestamp
```

The document ID must be the Firebase Authentication user's UID. Do not create a public registration flow.

## Rules

The repository contains locked-down `firestore.rules`. Storage rules are retained as an archived future-migration artifact, but Storage is not initialized or used by the application.

```text
firebase login
firebase use --add
npm run firebase:deploy:firestore
```

No `.firebaserc` is committed because the project ID has not been supplied.

## Storage and billing

This project remains on Firebase Spark. Firebase Storage is intentionally not initialized or imported. Product images, gallery images, and chant audio will use Google Drive in a future phase; no Drive integration exists yet. No billing changes are made by this code.

## Current scope

The app provides Firebase-backed `/admin/login`, `/admin`, `/admin/products`, `/admin/chants`, `/admin/gallery`, and `/admin/settings` management. Products, chants, gallery metadata, and settings use Firestore with local public-data fallbacks. Orders, uploads, payments, and Google Drive integration remain future phases.
