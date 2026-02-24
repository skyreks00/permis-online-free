import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if Firebase is properly configured
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const isFirebaseConfigured = requiredFields.every(field => 
  firebaseConfig[field] && firebaseConfig[field].trim().length > 0
);

if (!isFirebaseConfigured) {
  console.warn("⚠️ Firebase is not fully configured. Cloud sync features will be disabled.");
  console.warn("📝 To enable Firebase, ensure all required variables are set in .env.local");
  console.warn("📋 Required: apiKey, authDomain, projectId, appId");
}

let app, auth, db;

// Only attempt to initialize if configured
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Ensure db is a valid object
    if (!db || typeof db !== 'object') {
        throw new Error("Firestore init returned invalid object: " + db);
    }

    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error.message);
    console.error("🔧 Please check your Firebase configuration in .env.local");
    // Set to null to indicate Firebase is unavailable
    auth = null;
    db = null;
    app = null;
  }
} else {
  console.log("ℹ️ Firebase initialization skipped - configuration incomplete");
  auth = null;
  db = null;
  app = null;
}

export { app };
export { auth, db };
export const githubProvider = new GithubAuthProvider();

// Scopes optionnels
// githubProvider.addScope('repo');

export { doc, getDoc, setDoc };

export const loginWithGitHub = async () => {
  if (!auth) {
    throw new Error("Firebase is not configured. Please check your .env.local file.");
  }
  return signInWithPopup(auth, githubProvider);
};

export const logout = async () => {
  if (!auth) {
    throw new Error("Firebase is not configured");
  }
  return signOut(auth);
};

