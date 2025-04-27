document.addEventListener('DOMContentLoaded', () => {
    // Firebase configuration (replace with your actual config!)
    const firebaseConfig = {
        apiKey: "AIzaSyBkk-f7ov5KB_FWgiyyJFCp1tNV_nBpKjg",
        authDomain: "smart-shopper-10261.firebaseapp.com",
        projectId: "smart-shopper-10261",
        storageBucket: "smart-shopper-10261.firebasestorage.app",
        messagingSenderId: "676320767038",
        appId: "1:676320767038:web:2c258f25407c75f4b9b56f",
      };

  
    // Initialize Firebase and make available globally
    if (!window.firebaseApp) {
      window.firebaseApp = firebase.initializeApp(firebaseConfig);
      window.firebaseAuth = firebase.auth();
      window.firebaseDb = firebase.firestore();
  }

    const auth = firebase.auth(); // Get auth from 
    
    document.getElementById('googleLoginBtn').addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
  
      auth.signInWithPopup(provider)
        .then((result) => {
          console.log("Signed in as:", result.user.displayName);
          // Redirect to user dashboard or homepage
          window.location.href = "userhome.html"; 
        })
        .catch((error) => {
          console.error("Google Sign-in Error:", error);
          alert("Failed to sign in with Google. Try again!");
        });
    });
  
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const loginModalElement = document.getElementById('loginModal');
    const getStartedButton = document.querySelector('.btn-custom');
  
    // Handle Sign-Up
    if (signupForm) {
      signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
  
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
  
        if (password !== confirmPassword) {
          alert('Passwords do not match. Please retype them.');
          return;
        }
  
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            alert('Account created! You can now log in.');
            bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
            new bootstrap.Modal(document.getElementById('loginModal')).show();
          })
          .catch(error => {
            alert(error.message);
          });
      });
    }
  
    // Handle Login
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
  
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
  
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            // Redirect to user home
            window.location.href = 'userhome.html';
          })
          .catch(error => {
            alert(error.message);
          });
      });
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User is signed in:", user.email);
        // Maybe auto-redirect here too
      }
    });

  });
