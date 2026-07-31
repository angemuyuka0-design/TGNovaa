
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkva3N44knUnCQO_tsoqR1COFYCmUSB5M",
  authDomain: "gestion-taches-86f9c.firebaseapp.com",
  projectId: "gestion-taches-86f9c",
  storageBucket: "gestion-taches-86f9c.appspot.com",
  messagingSenderId: "303505048434",
  appId: "1:303505048434:web:c8625d14a8303179bd93eb"
};

// Initialize Firebase with compat version (compatible with regular scripts)
var app = firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

console.log("Firebase connecté !");
