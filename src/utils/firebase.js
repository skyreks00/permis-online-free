import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAGA-3ns3qFV47KXsFfd97kac_9LhPyhY",
  authDomain: "permis-online-sync.firebaseapp.com",
  projectId: "permis-online-sync",
  storageBucket: "permis-online-sync.firebasestorage.app",
  messagingSenderId: "653028638132",
  appId: "1:653028638132:web:028b727230365733a846e1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const githubProvider = new GithubAuthProvider();

// We need 'repo' scope to push progress to the user's private/public repo
githubProvider.addScope('repo');

export const loginWithGitHub = () => signInWithPopup(auth, githubProvider);
export const logout = () => signOut(auth);
