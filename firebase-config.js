// Firebase web app config. It is public by design: security comes from firestore.rules, not from hiding this.
// Fill it in from the Firebase console (Project settings > Your apps > Web app > SDK setup and configuration),
// see docs/CLOUD_SETUP.md. Leave it null and the app runs without accounts, saving on the device only.
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || null;
// Example:
// window.FIREBASE_CONFIG = { apiKey: '...', authDomain: 'your-project.firebaseapp.com', projectId: 'your-project', appId: '...' };

// True only when running the local emulators (npm run emulators). Never true in production.
window.FIREBASE_EMULATOR = window.FIREBASE_EMULATOR || false;
