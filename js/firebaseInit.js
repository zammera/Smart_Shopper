import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBkk-f7ov5KB_FWgiyyJFCp1tNV_nBpKjg",
    authDomain: "smart-shopper-10261.firebaseapp.com",
    projectId: "smart-shopper-10261",
    storageBucket: "smart-shopper-10261.firebasestorage.app",
    messagingSenderId: "676320767038",
    appId: "1:676320767038:web:2c258f25407c75f4b9b56f",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };