import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBZY66dq48nzmtcTBgOcL2wPRxS61oW7v4",
    authDomain: "vibespace-2fd9e.firebaseapp.com",
    projectId: "vibespace-2fd9e",
    storageBucket: "vibespace-2fd9e.firebasestorage.app",
    messagingSenderId: "696205443161",
    appId: "1:696205443161:web:14e8739daa6b6d32f57148",
    measurementId: "G-72B6896QXB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, storage, auth, googleProvider };
