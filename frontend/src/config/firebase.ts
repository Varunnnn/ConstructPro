import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Official Firebase configuration for ConstructPro
const firebaseConfig = {
  apiKey: "AIzaSyDn8wp2Vb8qyqfBdjiCWon0S1O1wV_9k8A",
  authDomain: "constructpro-238c7.firebaseapp.com",
  projectId: "constructpro-238c7",
  storageBucket: "constructpro-238c7.firebasestorage.app",
  messagingSenderId: "575374392592",
  appId: "1:575374392592:web:5ec5e38cd3a877ac19f995",
  measurementId: "G-XNGZJS2K1C"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
