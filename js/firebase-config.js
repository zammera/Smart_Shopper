// Check if Firebase is already initialized
if (!window.firebaseApp) {
    // Initialize with same config as index.js
    const firebaseConfig = {
        apiKey: "AIzaSyBkk-f7ov5KB_FWgiyyJFCp1tNV_nBpKjg",
        authDomain: "smart-shopper-10261.firebaseapp.com",
        projectId: "smart-shopper-10261",
        storageBucket: "smart-shopper-10261.firebasestorage.app",
        messagingSenderId: "676320767038",
        appId: "1:676320767038:web:2c258f25407c75f4b9b56f"
    };
    window.firebaseApp = firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
}