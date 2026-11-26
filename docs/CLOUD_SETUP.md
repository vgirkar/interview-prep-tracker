# Accounts and sync: setting up Firebase

The site works without any of this, saving progress on the device. With a Firebase project behind it, people sign in
with Google or an email link and their progress follows them across devices. Firebase's Spark plan is free, needs no
card, and does not pause idle projects. Everything below takes about five minutes.

## 1. Create the project

1. Go to https://console.firebase.google.com with the Google account that should own the project and create a project
   (any name, for example `interview-prep`). Google Analytics can stay off.
2. Build > Authentication > Get started > Sign-in method: enable **Google**, and enable **Email/Password** with
   **Email link (passwordless sign-in)** switched on.
3. Authentication > Settings > Authorized domains: add the site's domain, for example `vgirkar.github.io`
   (localhost is already there). Sign-in only works over http(s), not from a file opened on disk.
4. Build > Firestore Database > Create database > Start in **production mode**, pick a region near your users.

## 2. Connect the site

1. Project settings (gear) > Your apps > Add app > Web. Register it, no hosting needed. Copy the `firebaseConfig`.
2. Paste it into `firebase-config.js`:

   ```js
   window.FIREBASE_CONFIG = { apiKey: '...', authDomain: 'interview-prep.firebaseapp.com', projectId: 'interview-prep', appId: '...' };
   ```

   The config is public on purpose; the rules below are what protect the data.
3. Put the project id in `.firebaserc` and deploy the security rules:

   ```sh
   npx -y firebase-tools@13 login
   npm run rules
   ```

   The rules let each signed-in user read and write only `users/{their uid}/...`.
4. Commit and push. The Sign in button appears in the sidebar as soon as the config is present.

## 3. Local development with the emulators

```sh
npm run emulators      # Auth on 9099, Firestore on 8181, project demo-prep, needs Java 11+
npm run serve          # the site on http://localhost:8765
```

Open the site with `window.FIREBASE_CONFIG = { apiKey: 'demo', projectId: 'demo-prep', authDomain: 'demo-prep.firebaseapp.com', appId: 'demo' }`
and `window.FIREBASE_EMULATOR = true` in `firebase-config.js`. In the console, `cloud.devSignIn('you@example.com')`
signs in a fake Google user. Revert both before committing.

## What syncs and how

- Five documents per user: checks, log, apps, custom, tests, plus a profile (start date, hours a day, name, email).
- Writes are debounced and sent per document; other open devices receive changes live.
- On the first sign-in from a device, what is on the device is merged with the account: ticks and logs are combined,
  the earliest completion date wins, hours and problems take the higher value, notes and links from the device win.
  On later sign-ins the account is the source of truth, except for edits made while offline, which are merged in.
- Signing out leaves the device copy in place. Clear it from Settings if the device is shared.

## Not yet multi-user

The morning and evening emails still come from the GitHub Actions workflow for one inbox, using the plan's default
start date. Per-user email is the next step and needs a scheduled job that reads each profile.
