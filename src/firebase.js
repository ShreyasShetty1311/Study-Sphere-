// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFUpKpZS4YK5Z1U2bngh3Gj6FBIuOKf2U",
  authDomain: "study-sphere-bmsce.firebaseapp.com",
  projectId: "study-sphere-bmsce",
  storageBucket: "study-sphere-bmsce.firebasestorage.app",
  messagingSenderId: "977323909212",
  appId: "1:977323909212:web:f61271d5eae3e7f9c28699"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { signInWithEmailAndPassword, createUserWithEmailAndPassword };