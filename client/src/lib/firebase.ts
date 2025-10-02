import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBXHGhRQ8sA-6vIoHbV71f5Hmcv1K6EnAo",
    authDomain: "med-e-mint.firebaseapp.com",
    projectId: "med-e-mint",
    storageBucket: "med-e-mint.firebasestorage.app",
    messagingSenderId: "964509543025",
    appId: "1:964509543025:web:82fe5587d24686752609d0",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const prescriptionsCollection = collection(db, "prescriptions");