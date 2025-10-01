
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  "projectId": "studio-1514296680-a9097",
  "appId": "1:924625449523:web:da8365392ef59da3f16946",
  "apiKey": "AIzaSyCjI1t3hqkosOztHXN0-59j6xvtW7cWz9o",
  "authDomain": "studio-1514296680-a9097.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "924625449523",
  "storageBucket": "studio-1514296680-a9097.appspot.com"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
