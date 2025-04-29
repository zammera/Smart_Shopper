// navbar.js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase if not already initialized
    const firebaseConfig = {
      apiKey: "AIzaSyBkk-f7ov5KB_FWgiyyJFCp1tNV_nBpKjg",
      authDomain: "smart-shopper-10261.firebaseapp.com",
      projectId: "smart-shopper-10261",
      storageBucket: "smart-shopper-10261.firebasestorage.app",
      messagingSenderId: "676320767038",
      appId: "1:676320767038:web:2c258f25407c75f4b9b56f"
    };
  
    if (!window.firebaseApp) {
      window.firebaseApp = firebase.initializeApp(firebaseConfig);
      window.firebaseAuth = firebase.auth();
      window.firebaseDb = firebase.firestore();
    }
  
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const greetingElement = document.getElementById('userGreeting');
        if (greetingElement) {
          try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
              const fullName = userDoc.data().fullName || "User";
              greetingElement.textContent = `Hello, ${fullName}!`;
            } else {
              greetingElement.textContent = "Hello!";
            }
          } catch (error) {
            console.error("Error fetching user name:", error);
          }
        }
      }
    });
  });
  