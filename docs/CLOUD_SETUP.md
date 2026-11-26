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

## 4. Daily emails for everyone

Signed-in people turn the morning plan and the evening reminder on in Settings. The GitHub Actions workflow in
`.github/workflows/daily-email.yml` runs every hour and emails each of them at 7 and 21 in their own timezone, from
their own start date, hours a day, rest days and ticks, once a day each.

1. Firebase console > Project settings > Service accounts > Generate new private key. Keep the JSON file private.
2. GitHub > the repo > Settings > Secrets and variables > Actions, add:
   - `FIREBASE_SERVICE_ACCOUNT`: the whole JSON file as one secret.
   - `MAIL_USERNAME` and `MAIL_APP_PASSWORD`: a Gmail address and an app password (Google account > Security >
     2-step verification > App passwords). Gmail allows roughly 500 recipients a day; past that, switch the transport in
     `scripts/daily-email.mjs` to a sending service such as Resend.
   - `MAIL_TO` is only used when there is no service account (single-inbox mode).
3. Run the workflow by hand once with dry run on to see who would get what. The built emails are attached to the run.

Without the service account secret the workflow keeps the old behaviour: one email to `MAIL_TO` from the default dates.
