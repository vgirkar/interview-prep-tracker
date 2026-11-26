// Accounts and cross-device sync on Firebase (Auth + Firestore). Loaded as a module after app.js.
// Runs only when firebase-config.js provides a config; otherwise the app stays device-only.
// Exposes window.cloud with: ready (promise), user, onUser(fn), signInGoogle(), sendLink(email), completeLink(),
// signOut(), doc(name).get()/set()/watch(), and devSignIn(email) for the local emulators.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithCredential, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const cfg = window.FIREBASE_CONFIG;
if (!cfg || !cfg.apiKey || !cfg.projectId) {
  window.cloud = null;
} else {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (window.FIREBASE_EMULATOR) {
    // true uses the ports in firebase.json; an object { auth: 'host:port', firestore: 'host:port' } overrides them.
    const em = typeof window.FIREBASE_EMULATOR === 'object' ? window.FIREBASE_EMULATOR : {};
    const [fh, fp] = (em.firestore || '127.0.0.1:8181').split(':');
    connectAuthEmulator(auth, 'http://' + (em.auth || '127.0.0.1:9099'), { disableWarnings: true });
    connectFirestoreEmulator(db, fh, Number(fp));
  }
  const listeners = [];
  const toUser = (u) => (u ? { id: u.uid, email: u.email || '', name: u.displayName || '', photo: u.photoURL || '' } : null);
  const cloud = {
    user: null,
    emulator: !!window.FIREBASE_EMULATOR,
    ready: new Promise((resolve) => {
      let first = true;
      onAuthStateChanged(auth, (u) => {
        cloud.user = toUser(u);
        if (first) { first = false; resolve(cloud.user); }
        listeners.forEach((f) => f(cloud.user));
      });
    }),
    onUser(f) { listeners.push(f); },
    signInGoogle() {
      const p = new GoogleAuthProvider();
      return setPersistence(auth, browserLocalPersistence).then(() => signInWithPopup(auth, p)).catch((e) => {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment' || e.code === 'auth/cancelled-popup-request')) return signInWithRedirect(auth, p);
        throw e;
      });
    },
    sendLink(email) {
      const url = location.origin + location.pathname;
      return sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true }).then(() => { try { localStorage.setItem('prep-signin-email', email); } catch (e) {} });
    },
    completeLink() {
      const redirect = getRedirectResult(auth).catch(() => null);
      if (!isSignInWithEmailLink(auth, location.href)) return redirect;
      let email = null;
      try { email = localStorage.getItem('prep-signin-email'); } catch (e) {}
      if (!email) email = window.prompt('Confirm the email address you used, to finish signing in');
      if (!email) return redirect;
      return signInWithEmailLink(auth, email, location.href).then((r) => {
        try { localStorage.removeItem('prep-signin-email'); } catch (e) {}
        history.replaceState(null, '', location.pathname + location.hash);
        return r;
      });
    },
    signOut() { return signOut(auth); },
    devSignIn(email) {
      if (!cloud.emulator) return Promise.reject(new Error('devSignIn works only with the emulators'));
      const sub = email.replace(/[^a-z0-9]/gi, '_');
      return signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true, name: email.split('@')[0] })));
    },
    doc(name) {
      // Email preferences live in a top-level collection so the mail job can list them; everything else sits under the user.
      const ref = () => (name === 'mail' ? doc(db, 'mail', cloud.user.id) : doc(db, 'users', cloud.user.id, 'docs', name));
      return {
        get() { return getDoc(ref()).then((s) => ({ exists: s.exists(), data: () => s.data() })); },
        set(data) { return setDoc(ref(), Object.assign({}, data, { updatedAt: serverTimestamp() })); },
        watch(cb) { return onSnapshot(ref(), (s) => { if (!s.metadata.hasPendingWrites) cb(s.exists() ? s.data() : null); }, () => {}); }
      };
    }
  };
  window.cloud = cloud;
}
window.dispatchEvent(new Event('cloud-ready'));
