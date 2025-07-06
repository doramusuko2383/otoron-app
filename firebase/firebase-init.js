import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAunlq7BhL9A4JvcXszpYkDoXAPPSvhlxo",
  authDomain: "playotoron.com",
  projectId: "otoron-app",
  storageBucket: "otoron-app.appspot.com",
  messagingSenderId: "572910581480",
  appId: "1:572910581480:web:3ddfb2b11404713be2fb5d",
  measurementId: "G-7Q3MX6Z3XK"
};

const app = initializeApp(firebaseConfig);

// ✅ 名前を「firebaseAuth」に統一して export
export const firebaseAuth = getAuth(app);
