// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqaaqayd-vemVUbTst1ZepM9xjSgLUyIk",
  authDomain: "sinproesemmaaap.firebaseapp.com",
  projectId: "sinproesemmaaap",
  storageBucket: "sinproesemmaaap.firebasestorage.app",
  messagingSenderId: "415145894528",
  appId: "1:415145894528:web:a1edaaa4a3df1362fafc65",
  measurementId: "G-KW628NNN29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy };
